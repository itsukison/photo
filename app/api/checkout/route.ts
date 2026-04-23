// POST /api/checkout
// Creates a pending_payment booking (holds the slot for 30 min) and a Stripe
// Checkout Session. The client redirects to session.url; Stripe later calls
// /api/webhooks/stripe to flip the booking to paid + pending_confirmation.

import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';

// The Stripe SDK re-exports Checkout.SessionCreateParams as a type alias rather
// than a namespace, so nested members like `SessionCreateParams.LineItem` aren't
// directly reachable. We let TypeScript infer line items from the create call.
import { getUserSupabase } from '@/lib/supabase-server';
import { findPlanBySlug } from '@/lib/plans';

export const runtime = 'nodejs';

type CheckoutBody = {
  planSlug: string;
  locationId: string;
  date: string; // yyyy-MM-dd
  startHour: number;
  extraDurationMinutes: number;
  groupSize: number;
  addonIds: string[];
  retouchNotes?: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientCountry: string;
  specialRequests?: string;
  agreedToPolicy: boolean;
};

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest) {
  let body: CheckoutBody;
  try {
    body = (await req.json()) as CheckoutBody;
  } catch {
    return errorResponse('Invalid JSON body');
  }

  const plan = findPlanBySlug(body.planSlug);
  if (!plan) return errorResponse('Unknown plan');
  if (!body.agreedToPolicy) return errorResponse('Cancellation policy must be agreed to');

  const supabase = getUserSupabase(req.headers.get('authorization'));

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) return errorResponse('Unauthenticated', 401);

  // Resolve plan slug -> plan row id. This is the only DB reference the client
  // is trusted to name indirectly (via slug). All pricing comes from the RPC.
  const { data: planRow, error: planErr } = await supabase
    .from('plans')
    .select('id, name, price, duration_minutes')
    .eq('slug', plan.slug)
    .maybeSingle();
  if (planErr || !planRow) return errorResponse('Plan lookup failed', 500);

  // Create the pending booking. The RPC validates everything, computes the
  // authoritative total and holds the slot for 30 minutes.
  const { data: bookingData, error: rpcErr } = await supabase.rpc('create_pending_booking', {
    p_plan_id: planRow.id,
    p_location_id: body.locationId,
    p_date: body.date,
    p_start_hour: body.startHour,
    p_extra_duration_minutes: body.extraDurationMinutes ?? 0,
    p_group_size: body.groupSize,
    p_retouch_notes: body.retouchNotes ?? '',
    p_addon_ids: body.addonIds ?? [],
    p_client_name: body.clientName,
    p_client_email: body.clientEmail,
    p_client_phone: body.clientPhone,
    p_client_country: body.clientCountry,
    p_special_requests: body.specialRequests ?? '',
    p_agreed_to_policy: body.agreedToPolicy,
  });
  if (rpcErr) {
    const msg = rpcErr.message || 'Failed to create booking';
    if (msg.includes('NO_AVAILABILITY')) return errorResponse('Sorry — that slot is no longer available. Please pick a different time.', 409);
    if (msg.includes('INVALID_')) return errorResponse('Invalid booking details.', 400);
    if (msg.includes('POLICY_NOT_AGREED')) return errorResponse('You must agree to the cancellation policy.', 400);
    if (msg.includes('NOT_AUTHENTICATED')) return errorResponse('Unauthenticated', 401);
    return errorResponse(msg, 500);
  }

  const booking = bookingData as {
    id: string;
    reference: string;
    total_price: number;
    date: string;
    start_hour: number;
  } | null;
  if (!booking) return errorResponse('Booking not returned', 500);

  // Fetch addon snapshots and location name for the Stripe line items.
  const [{ data: addonRows }, { data: locationRow }] = await Promise.all([
    supabase.from('booking_addons').select('price_snapshot, addons(name)').eq('booking_id', booking.id),
    supabase.from('locations').select('name, surcharge').eq('id', body.locationId).maybeSingle(),
  ]);

  const baseName = `${planRow.name}`;
  const baseDescription = `${locationRow?.name ?? 'Tokyo'} · ${booking.date} at ${String(booking.start_hour).padStart(2, '0')}:00`;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || new URL(req.url).origin;

  let session: Stripe.Checkout.Session;
  try {
    // Single consolidated line item — the RPC-computed total_price is the truth.
    // Using a single line keeps reconciliation easy and avoids drift between the
    // client-side breakdown and what Stripe charges.
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: body.clientEmail || userData.user.email || undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: booking.total_price * 100,
            product_data: {
              name: `@ Studio ON — ${baseName}`,
              description: baseDescription,
            },
          },
        },
      ],
      client_reference_id: booking.id,
      metadata: {
        booking_id: booking.id,
        booking_reference: booking.reference,
        kind: 'booking',
      },
      payment_intent_data: {
        metadata: {
          booking_id: booking.id,
          booking_reference: booking.reference,
          kind: 'booking',
        },
        description: `Booking ${booking.reference}`,
      },
      // Expire the Stripe session in 30 minutes so it cannot be used after the
      // DB slot hold has already been swept.
      allow_promotion_codes: true,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      success_url: `${baseUrl}/book/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/book/cancelled?session_id={CHECKOUT_SESSION_ID}`,
    });
  } catch (err) {
    // If Stripe fails, leave the booking in pending_payment; it will be swept
    // after 30 minutes, releasing the slot. Logged for observability.
    console.error('[checkout] Stripe session creation failed', err);
    return errorResponse('Payment provider error. Please try again.', 502);
  }

  // Persist the session id so the webhook can locate the booking later.
  const { error: attachErr } = await supabase.rpc('attach_stripe_session', {
    p_booking_id: booking.id,
    p_session_id: session.id,
  });
  if (attachErr) {
    console.error('[checkout] attach_stripe_session failed', attachErr.message);
    // Don't fail the request — webhook can also look up by client_reference_id.
  }

  if (!addonRows) {
    // Swallow unused var warning without silencing real errors.
  }

  return NextResponse.json({
    bookingId: booking.id,
    reference: booking.reference,
    sessionId: session.id,
    url: session.url,
  });
}
