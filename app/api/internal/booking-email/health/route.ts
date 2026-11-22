import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { normalizeResendSender, renderBookingConfirmation } from '@/lib/booking-confirmation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Read-only server preflight. No customer data, sends, claims or test bookings.
// The existing privileged server credential is required; never put it in a URL.
export async function GET(request: NextRequest) {
  const expected = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supplied = request.headers.get('authorization')?.replace(/^Bearer /, '') ?? '';
  if (!expected || supplied.length !== expected.length || !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const senderCandidates = process.env.RESEND_FROM_EMAIL?.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) ?? [];
  let from: string | null = null;
  try { from = normalizeResendSender(process.env.RESEND_FROM_EMAIL, process.env.RESEND_FROM_NAME?.trim() || 'Studio ON'); } catch { /* Report validation only. */ }
  const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
    headers: { apikey: expected, Authorization: `Bearer ${expected}` },
    cache: 'no-store', signal: AbortSignal.timeout(10_000),
  });
  const schema = response.ok ? await response.json() as { paths?: Record<string, unknown> } : null;
  const databaseLedgerReady = Boolean(schema?.paths?.['/booking_email_notifications']);
  let providerReadStatus: number | null = null;
  let providerDomains: Array<{ name: string; status: string }> | null = null;
  if (process.env.RESEND_API_KEY) {
    const domainsResponse = await fetch('https://api.resend.com/domains', {
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY.trim()}` },
      cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(10_000),
    });
    providerReadStatus = domainsResponse.status;
    if (domainsResponse.ok) {
      const domains = await domainsResponse.json() as { data?: Array<{ name: string; status: string }> };
      providerDomains = (domains.data ?? []).map(({ name, status }) => ({ name, status }));
    }
  }
  return NextResponse.json({
    senderCandidates, providerDomains, providerReadStatus,
    version: 'booking-confirmation-once-v1',
    sender: from, senderValid: Boolean(from),
    mailProviderConfigured: Boolean(process.env.RESEND_API_KEY),
    stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET),
    databaseLedgerReady,
  }, { headers: { 'Cache-Control': 'no-store' } });
}

// Provider-owned simulated recipient. The optional layout check copies only the
// owner's mailbox and never touches booking records or customer recipients.
// All preflight sends are unavailable on the production deployment.
export async function POST(request: NextRequest) {
  if (process.env.VERCEL_ENV !== 'preview') return NextResponse.json({ error: 'Not available' }, { status: 405 });
  const expected = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supplied = request.headers.get('authorization')?.replace(/^Bearer /, '') ?? '';
  if (!expected || supplied.length !== expected.length || !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json().catch(() => ({})) as { mode?: string };
  if (body.mode === 'conversation-layout') {
    const results = [];
    for (const variant of ['A', 'B']) {
      const reference = `TEST-THREAD-20261122-${variant}`;
      const content = renderBookingConfirmation({
        id: `studio-on-layout-test-20261122-${variant.toLowerCase()}`,
        reference, client_email: 'delivered@resend.dev',
        date: '2026-11-24', start_minutes: 1320, end_minutes: 1350,
        group_size: 4, status: 'confirmed', payment_status: 'paid', total_price: 0,
        stripe_payment_intent_id: null, sessionName: 'Tokyo Quick Shot',
        locationName: 'Shibuya', addons: [], requests: [],
      });
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST', redirect: 'error', signal: AbortSignal.timeout(20_000),
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY?.trim()}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': `studio-on-conversation-layout-${reference}-v1`,
        },
        body: JSON.stringify({
          from: normalizeResendSender(process.env.RESEND_FROM_EMAIL),
          to: ['delivered@resend.dev'], cc: ['studio.on.snap@gmail.com'],
          reply_to: 'studio.on.snap@gmail.com',
          subject: `[TEST ONLY] ${content.subject}`,
          headers: content.headers,
          html: '<p style="font-family:Arial,Helvetica,sans-serif;font-size:12px"><strong>TEST ONLY — layout verification; no real reservation.</strong></p>' + content.html,
          text: 'TEST ONLY — layout verification; no real reservation.\n\n' + content.text,
          tags: [{ name: 'test_type', value: 'conversation_layout' }],
        }),
      });
      const result = await response.json() as { id?: string; name?: string; message?: string };
      results.push({ reference, accepted: response.ok && Boolean(result.id), providerStatus: response.status, messageId: result.id, errorName: result.name, message: result.message });
      if (!response.ok) break;
    }
    return NextResponse.json({ results }, { headers: { 'Cache-Control': 'no-store' } });
  }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST', redirect: 'error', signal: AbortSignal.timeout(20_000),
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY?.trim()}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': 'studio-on-realtime-preflight-20261122-v1',
    },
    body: JSON.stringify({
      from: normalizeResendSender(process.env.RESEND_FROM_EMAIL),
      to: ['delivered@resend.dev'],
      subject: 'Studio ON email delivery preflight',
      text: 'Synthetic preflight only. No customer or booking data.',
    }),
  });
  const result = await response.json() as { id?: string; name?: string; message?: string };
  return NextResponse.json({ accepted: response.ok && Boolean(result.id), providerStatus: response.status, messageId: result.id, errorName: result.name, message: result.message }, { headers: { 'Cache-Control': 'no-store' } });
}
