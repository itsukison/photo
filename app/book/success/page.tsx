// Post-payment landing page. Stripe redirects here on success.
// Serves as a fallback confirmation if the webhook hasn't landed yet:
// we call a small server check that retrieves the session and, if Stripe
// says it's paid but our DB hasn't caught up, performs the transition itself.

import Link from 'next/link';
import { Check } from 'lucide-react';
import { stripe } from '@/lib/stripe';
import { getAnonSupabase } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{ session_id?: string }>;
};

async function ensureBookingPaid(sessionId: string): Promise<{ reference: string; name: string; error?: string }> {
  const supabase = getAnonSupabase();
  const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['payment_intent'] });
  // 100% coupons produce 'no_payment_required' instead of 'paid'
  const paid = session.payment_status === 'paid' || session.payment_status === 'no_payment_required';

  // Use a SECURITY DEFINER RPC so RLS doesn't block the anon read.
  const { data: rows } = await supabase.rpc('get_booking_by_session', { p_session_id: sessionId });
  const bookingRow = rows?.[0] ?? null;

  if (!bookingRow) {
    return { reference: '', name: '', error: 'Booking not found for this session.' };
  }

  if (paid && bookingRow.payment_status !== 'paid') {
    // Fallback: the webhook hasn't processed yet. Drive the transition here.
    const piId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null;
    let chargeId: string | null = null;
    if (piId) {
      try {
        const pi = await stripe.paymentIntents.retrieve(piId, { expand: ['latest_charge'] });
        const charge = pi.latest_charge;
        if (typeof charge === 'string') chargeId = charge;
        else if (charge && 'id' in charge) chargeId = charge.id;
      } catch {}
    }
    await supabase.rpc('mark_booking_paid', {
      p_session_id: sessionId,
      p_payment_intent_id: piId,
      p_charge_id: chargeId,
    });
  }

  return { reference: bookingRow.reference, name: bookingRow.client_name };
}

export default async function BookingSuccessPage({ searchParams }: Props) {
  const { session_id } = await searchParams;

  let reference = '';
  let name = '';
  let error: string | undefined;
  if (session_id) {
    try {
      const r = await ensureBookingPaid(session_id);
      reference = r.reference;
      name = r.name;
      error = r.error;
    } catch (e) {
      console.error('[success page]', e);
      error = 'We could not verify your booking. If you were charged, please contact support.';
    }
  } else {
    error = 'Missing session identifier.';
  }

  return (
    <main className="min-h-screen bg-[#fcfcfc] text-black pt-24 md:pt-32 pb-20 md:pb-24">
      <div className="w-full max-w-xl mx-auto px-4 md:px-6 text-center py-12">
        {error ? (
          <>
            <h1 className="text-3xl md:text-4xl font-medium tracking-tight mb-4">Something went wrong</h1>
            <p className="text-gray-500 font-medium max-w-md mx-auto mb-10">{error}</p>
            <Link
              href="/profile"
              className="px-10 py-4 border border-black/10 rounded-full font-medium text-black hover:bg-black/5 transition-colors inline-block"
            >
              View My Bookings
            </Link>
          </>
        ) : (
          <>
            <div className="w-24 h-24 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8">
              <Check size={48} />
            </div>
            <h1 className="text-3xl md:text-4xl font-medium tracking-tight mb-4">Booking Confirmed!</h1>
            <p className="text-gray-500 font-medium max-w-md mx-auto mb-10">
              Thank you{name ? `, ${name}` : ''}. Your payment was received. We&apos;ll contact you within 24 hours to confirm the details of your session.
            </p>
            <div className="p-8 bg-white border border-black/10 rounded-2xl inline-block mb-10 shadow-sm">
              <div className="text-sm text-gray-500 mb-2 font-medium">Booking Reference</div>
              <div className="text-3xl font-mono font-medium tracking-wider text-black">{reference}</div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/profile"
                className="px-10 py-4 bg-black text-white rounded-full font-medium hover:bg-black/80 transition-colors inline-block"
              >
                View My Bookings
              </Link>
              <Link
                href="/"
                className="px-10 py-4 border border-black/10 rounded-full font-medium text-black hover:bg-black/5 transition-colors inline-block"
              >
                Return to Home
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
