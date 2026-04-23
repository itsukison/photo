// POST /api/bookings/[id]/reschedule
// Customer self-service rescheduling. Two paths:
//   1. Within the free window (>48h) — apply directly.
//   2. Within the paid window (24–48h) — create a Stripe Checkout Session for
//      the 50% fee, stash the new date/time, and return the redirect URL.
// Outside those windows (<24h) the server rejects.

import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { getUserSupabase } from '@/lib/supabase-server';

export const runtime = 'nodejs';

type Body = {
  newDate: string;
  newStartMinutes: number;
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const supabase = getUserSupabase(req.headers.get('authorization'));
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const { data: policyData, error: policyErr } = await supabase.rpc('get_booking_policy', { p_booking_id: id });
  if (policyErr) return NextResponse.json({ error: policyErr.message }, { status: 400 });
  const policy = Array.isArray(policyData) ? policyData[0] : policyData;
  if (!policy) return NextResponse.json({ error: 'Policy unavailable' }, { status: 404 });

  if (policy.can_reschedule_free) {
    const { data, error } = await supabase.rpc('apply_free_reschedule', {
      p_booking_id: id,
      p_new_date: body.newDate,
      p_new_start_minutes: body.newStartMinutes,
    });
    if (error) {
      const msg = error.message;
      if (msg.includes('NO_AVAILABILITY')) return NextResponse.json({ error: 'That new slot is unavailable. Please pick another.' }, { status: 409 });
      if (msg.includes('FREE_RESCHEDULE_WINDOW_CLOSED')) return NextResponse.json({ error: 'Free reschedule window has closed.' }, { status: 409 });
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json({ mode: 'free', booking: data });
  }

  if (policy.can_reschedule_paid) {
    const feeCents: number = policy.reschedule_fee_amount_cents;

    // Fetch booking details to compose the line item description.
    const { data: bookingRow } = await supabase
      .from('bookings')
      .select('reference, client_email, date, start_hour')
      .eq('id', id)
      .maybeSingle();
    if (!bookingRow) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || new URL(req.url).origin;

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
              unit_amount: feeCents,
              product_data: {
                name: `Rescheduling Fee — ${bookingRow.reference}`,
                description: `New date: ${body.newDate} at ${String(Math.floor(body.newStartMinutes / 60)).padStart(2, '0')}:${String(body.newStartMinutes % 60).padStart(2, '0')}`,
              },
            },
          },
        ],
        client_reference_id: id,
        metadata: {
          booking_id: id,
          kind: 'reschedule_fee',
          new_date: body.newDate,
          new_start_hour: String(body.newStartHour),
        },
        payment_intent_data: {
          metadata: {
            booking_id: id,
            kind: 'reschedule_fee',
          },
          description: `Reschedule fee for booking ${bookingRow.reference}`,
        },
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
        success_url: `${baseUrl}/profile?reschedule=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/profile?reschedule=cancelled`,
      });
    } catch (err) {
      console.error('[reschedule] Stripe session creation failed', err);
      return NextResponse.json({ error: 'Payment provider error.' }, { status: 502 });
    }

    // Stash the new date/time + session id so the webhook can apply after payment.
    const { error: stashErr } = await supabase.rpc('stash_pending_reschedule', {
      p_booking_id: id,
      p_new_date: body.newDate,
      p_new_start_minutes: body.newStartMinutes,
      p_session_id: session.id,
    });
    if (stashErr) {
      console.error('[reschedule] stash_pending_reschedule failed', stashErr.message);
      // The Stripe session exists, but we could not persist the intent. Cancel
      // the session to prevent a paid-but-unapplied state.
      try {
        await stripe.checkout.sessions.expire(session.id);
      } catch {}
      return NextResponse.json({ error: stashErr.message }, { status: 500 });
    }

    return NextResponse.json({ mode: 'paid', feeCents, url: session.url, sessionId: session.id });
  }

  return NextResponse.json({ error: 'Rescheduling is not possible within 24 hours of the shoot.' }, { status: 409 });
}
