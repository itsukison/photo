// POST /api/webhooks/stripe
// Stripe → server event receiver. Verifies signatures, is idempotent, and
// handles the full payment lifecycle for bookings and reschedule fees.

import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe, STRIPE_WEBHOOK_SECRET } from '@/lib/stripe';
import { getAnonSupabase } from '@/lib/supabase-server';

export const runtime = 'nodejs';

// Stripe requires the raw request body for signature verification. The app
// router provides req.text() which preserves the raw payload.
export async function POST(req: NextRequest) {
  const signature = req.headers.get('stripe-signature');
  if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  if (!STRIPE_WEBHOOK_SECRET) {
    console.error('[webhook] STRIPE_WEBHOOK_SECRET is not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[webhook] signature verification failed', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = getAnonSupabase();

  // Record the event first. If this event was already processed, skip it.
  const { data: inserted, error: recordErr } = await supabase.rpc('record_stripe_event', {
    p_event_id: event.id,
    p_event_type: event.type,
  });
  if (recordErr) {
    console.error('[webhook] record_stripe_event failed', recordErr.message);
    return NextResponse.json({ error: 'event record failed' }, { status: 500 });
  }
  if (inserted === false) {
    // Already seen — acknowledge.
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        await handleCheckoutCompleted(event.data.object);
        break;
      }
      case 'checkout.session.expired': {
        await handleCheckoutExpired(event.data.object);
        break;
      }
      case 'payment_intent.payment_failed': {
        await handlePaymentFailed(event.data.object);
        break;
      }
      case 'charge.refunded': {
        await handleChargeRefunded(event.data.object);
        break;
      }
      case 'charge.dispute.created': {
        await handleChargeDisputeCreated(event.data.object);
        break;
      }
      default:
        // Unhandled event types are acknowledged to stop Stripe retries.
        break;
    }
  } catch (err) {
    console.error(`[webhook] handler for ${event.type} threw`, err);
    return NextResponse.json({ error: 'handler error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const kind = session.metadata?.kind;
  const supabase = getAnonSupabase();

  const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null;

  // Fetch the PI to recover the charge id.
  let chargeId: string | null = null;
  if (paymentIntentId) {
    try {
      const pi = await stripe.paymentIntents.retrieve(paymentIntentId, { expand: ['latest_charge'] });
      const charge = pi.latest_charge;
      if (typeof charge === 'string') chargeId = charge;
      else if (charge && 'id' in charge) chargeId = charge.id;
    } catch (err) {
      console.warn('[webhook] failed to expand payment intent', err);
    }
  }

  if (kind === 'reschedule_fee') {
    // Apply the stashed reschedule after fee payment.
    const { error } = await supabase.rpc('complete_paid_reschedule', { p_session_id: session.id });
    if (error) console.error('[webhook] complete_paid_reschedule failed', error.message);
    return;
  }

  // Default: booking payment.
  const { error } = await supabase.rpc('mark_booking_paid', {
    p_session_id: session.id,
    p_payment_intent_id: paymentIntentId,
    p_charge_id: chargeId,
  });
  if (error) console.error('[webhook] mark_booking_paid failed', error.message);
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  const supabase = getAnonSupabase();
  const kind = session.metadata?.kind;
  if (kind === 'reschedule_fee') {
    // Clear the pending reschedule; the booking stays on its original slot.
    await supabase.from('bookings').update({
      pending_reschedule_date: null,
      pending_reschedule_start_hour: null,
      reschedule_session_id: null,
    }).eq('reschedule_session_id', session.id);
    return;
  }
  const { error } = await supabase.rpc('mark_booking_payment_failed', { p_session_id: session.id });
  if (error) console.error('[webhook] mark_booking_payment_failed (expired) failed', error.message);
}

async function handlePaymentFailed(pi: Stripe.PaymentIntent) {
  // Look up the session from the payment intent's id stored on the booking.
  const supabase = getAnonSupabase();
  const { data: rows } = await supabase
    .from('bookings')
    .select('id, stripe_checkout_session_id')
    .eq('stripe_payment_intent_id', pi.id)
    .limit(1);
  const sessionId = rows?.[0]?.stripe_checkout_session_id;
  if (!sessionId) return;
  const { error } = await supabase.rpc('mark_booking_payment_failed', { p_session_id: sessionId });
  if (error) console.error('[webhook] mark_booking_payment_failed (pi) failed', error.message);
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  // Sync refund_amount_cents to the canonical Stripe value. Handles refunds
  // issued outside our admin UI (e.g. directly in Stripe dashboard).
  const supabase = getAnonSupabase();
  const refundTotal = charge.amount_refunded;
  const { data: rows, error: selErr } = await supabase
    .from('bookings')
    .select('id, total_price, refund_amount_cents')
    .eq('stripe_charge_id', charge.id)
    .limit(1);
  if (selErr || !rows?.[0]) {
    console.warn('[webhook] charge.refunded: booking not found for charge', charge.id);
    return;
  }
  const booking = rows[0];
  const totalCents = (booking.total_price as number) * 100;
  const paymentStatus = refundTotal >= totalCents ? 'refunded' : refundTotal > 0 ? 'partially_refunded' : 'paid';
  const { error: updErr } = await supabase
    .from('bookings')
    .update({
      refund_amount_cents: refundTotal,
      payment_status: paymentStatus,
      refunded_at: new Date().toISOString(),
    })
    .eq('id', booking.id);
  if (updErr) console.error('[webhook] charge.refunded update failed', updErr.message);
}

async function handleChargeDisputeCreated(dispute: Stripe.Dispute) {
  const supabase = getAnonSupabase();
  const chargeId = typeof dispute.charge === 'string' ? dispute.charge : dispute.charge.id;
  const { error } = await supabase
    .from('bookings')
    .update({
      payment_status: 'disputed',
      cancelled_reason: 'dispute_opened',
    })
    .eq('stripe_charge_id', chargeId);
  if (error) console.error('[webhook] dispute update failed', error.message);
  // Admin should investigate in Membercheck.
}
