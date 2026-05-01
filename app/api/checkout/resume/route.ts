// POST /api/checkout/resume
// Resumes payment for an existing pending_payment booking by creating a fresh
// Stripe Checkout Session and extending the slot hold. Used when the original
// session was abandoned or expired.

import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { getUserSupabase } from '@/lib/supabase-server';

export const runtime = 'nodejs';

type ResumeBody = { bookingId: string };

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest) {
  let body: ResumeBody;
  try {
    body = (await req.json()) as ResumeBody;
  } catch {
    return errorResponse('Invalid JSON body');
  }
  if (!body.bookingId) return errorResponse('Missing bookingId');

  const supabase = getUserSupabase(req.headers.get('authorization'));
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) return errorResponse('Unauthenticated', 401);

  // Load the booking (RLS scopes to this user). Confirms ownership and
  // gives us the line-item data without trusting the client.
  const { data: bookingRow, error: bErr } = await supabase
    .from('bookings')
    .select(`
      id, reference, status, total_price, date, start_minutes,
      client_email, location_id,
      plans:plan_id ( name ),
      locations:location_id ( name )
    `)
    .eq('id', body.bookingId)
    .maybeSingle();
  if (bErr || !bookingRow) return errorResponse('Booking not found', 404);
  if (bookingRow.status !== 'pending_payment') {
    return errorResponse('This booking is not awaiting payment.', 409);
  }

  const planName = Array.isArray(bookingRow.plans)
    ? bookingRow.plans[0]?.name
    : (bookingRow.plans as { name?: string } | null)?.name;
  const locationName = Array.isArray(bookingRow.locations)
    ? bookingRow.locations[0]?.name
    : (bookingRow.locations as { name?: string } | null)?.name;

  const bH = Math.floor(bookingRow.start_minutes / 60);
  const bM = bookingRow.start_minutes % 60;
  const baseDescription = `${locationName ?? 'Seoul'} · ${bookingRow.date} at ${String(bH).padStart(2, '0')}:${String(bM).padStart(2, '0')}`;

  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || new URL(req.url).origin).replace(/\/+$/, '');

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: bookingRow.client_email || userData.user.email || undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: bookingRow.total_price * 100,
            product_data: {
              name: `@ Studio ON — ${planName ?? 'Booking'}`,
              description: baseDescription,
            },
          },
        },
      ],
      client_reference_id: bookingRow.id,
      metadata: {
        booking_id: bookingRow.id,
        booking_reference: bookingRow.reference,
        kind: 'booking',
      },
      payment_intent_data: {
        metadata: {
          booking_id: bookingRow.id,
          booking_reference: bookingRow.reference,
          kind: 'booking',
        },
        description: `Booking ${bookingRow.reference}`,
      },
      allow_promotion_codes: true,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      success_url: `${baseUrl}/book/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/book/cancelled?session_id={CHECKOUT_SESSION_ID}`,
    });
  } catch (err) {
    console.error('[resume] Stripe session creation failed', err);
    return errorResponse('Payment provider error. Please try again.', 502);
  }

  const { error: rpcErr } = await supabase.rpc('resume_pending_payment', {
    p_booking_id: bookingRow.id,
    p_session_id: session.id,
  });
  if (rpcErr) {
    const msg = rpcErr.message || 'Could not resume payment';
    if (msg.includes('SLOT_NO_LONGER_AVAILABLE')) {
      return errorResponse('That time slot is no longer available. Please book a new session.', 409);
    }
    if (msg.includes('BOOKING_DATE_PASSED')) {
      return errorResponse('This booking date has already passed.', 409);
    }
    if (msg.includes('BOOKING_NOT_RESUMABLE')) {
      return errorResponse('This booking is no longer awaiting payment.', 409);
    }
    if (msg.includes('NOT_AUTHENTICATED')) return errorResponse('Unauthenticated', 401);
    console.error('[resume] resume_pending_payment failed', msg);
    return errorResponse(msg, 500);
  }

  return NextResponse.json({
    bookingId: bookingRow.id,
    reference: bookingRow.reference,
    sessionId: session.id,
    url: session.url,
  });
}
