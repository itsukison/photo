// POST /api/bookings/[id]/cancel
// Customer-initiated cancellation. Computes refund amount via
// get_booking_policy, issues the Stripe refund, then applies the DB
// cancellation in a single RPC call. Order of operations matters:
// we refund first, then mark the booking as cancelled — if the RPC
// fails after refund, the next webhook (charge.refunded) will still
// sync the booking so no money is stranded.

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getUserSupabase } from '@/lib/supabase-server';

export const runtime = 'nodejs';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = getUserSupabase(req.headers.get('authorization'));

  // Auth sanity check — the RPC will also enforce ownership.
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const { data: policyData, error: policyErr } = await supabase.rpc('get_booking_policy', { p_booking_id: id });
  if (policyErr) return NextResponse.json({ error: policyErr.message }, { status: 400 });
  const policy = Array.isArray(policyData) ? policyData[0] : policyData;
  if (!policy) return NextResponse.json({ error: 'Policy unavailable' }, { status: 404 });
  if (!policy.can_cancel) return NextResponse.json({ error: 'Booking cannot be cancelled in its current state.' }, { status: 409 });

  const refundCents: number = policy.cancel_refund_amount_cents ?? 0;

  // Look up the Stripe payment intent for the refund.
  const { data: bookingRow, error: bErr } = await supabase
    .from('bookings')
    .select('stripe_payment_intent_id, stripe_charge_id, refund_amount_cents, total_price')
    .eq('id', id)
    .maybeSingle();
  if (bErr || !bookingRow) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

  let stripeRefundId: string | null = null;
  if (refundCents > 0) {
    if (!bookingRow.stripe_payment_intent_id && !bookingRow.stripe_charge_id) {
      return NextResponse.json({ error: 'No payment found for this booking.' }, { status: 409 });
    }
    try {
      const refund = await stripe.refunds.create({
        payment_intent: bookingRow.stripe_payment_intent_id ?? undefined,
        charge: bookingRow.stripe_payment_intent_id ? undefined : bookingRow.stripe_charge_id ?? undefined,
        amount: refundCents,
        reason: 'requested_by_customer',
        metadata: { booking_id: id, kind: 'customer_cancellation' },
      });
      stripeRefundId = refund.id;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Refund failed';
      console.error('[cancel] Stripe refund failed', err);
      return NextResponse.json({ error: msg }, { status: 502 });
    }
  }

  const { data: updated, error: applyErr } = await supabase.rpc('apply_booking_cancellation', {
    p_booking_id: id,
    p_refund_amount_cents: refundCents,
    p_stripe_refund_id: stripeRefundId,
  });
  if (applyErr) {
    // Refund went through but DB update failed. Log loudly so ops can
    // reconcile; charge.refunded webhook will also sync the DB.
    console.error('[cancel] apply_booking_cancellation failed after refund', applyErr.message, 'refund_id', stripeRefundId);
    return NextResponse.json({ error: applyErr.message, stripeRefundId }, { status: 500 });
  }

  return NextResponse.json({
    booking: updated,
    refundCents,
    stripeRefundId,
  });
}
