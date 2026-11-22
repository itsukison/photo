import 'server-only';

import { randomUUID } from 'node:crypto';
import { v5 as uuidV5 } from 'uuid';
import { getAdminSupabase } from '@/lib/supabase-server';
import { stripe } from '@/lib/stripe';
import {
  confirmationIneligibility, deliverClaimedEmail, normalizeResendSender,
  renderBookingConfirmation, type ConfirmationBooking, type DeliveryClaim,
} from '@/lib/booking-confirmation';

type RelatedName = { name: string } | { name: string }[] | null;
type BookingAddon = {
  price_snapshot: number;
  addon: RelatedName;
};

type BookingForEmail = {
  id: string;
  reference: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  client_country: string;
  special_requests: string | null;
  retouch_notes: string | null;
  date: string;
  start_minutes: number;
  end_minutes: number;
  extra_duration_minutes: number;
  group_size: number;
  status: string;
  payment_status: string;
  stripe_payment_intent_id: string | null;
  stripe_checkout_session_id: string | null;
  total_price: number;
  plan: RelatedName;
  location: RelatedName;
  assigned_member: RelatedName;
  booking_addons: BookingAddon[];
};

type EmailContent = {
  subject: string;
  html: string;
  text: string;
};

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

function relatedName(value: RelatedName): string | null {
  if (Array.isArray(value)) return value[0]?.name ?? null;
  return value?.name ?? null;
}

function confirmationBooking(booking: BookingForEmail): ConfirmationBooking {
  return {
    ...booking,
    sessionName: relatedName(booking.plan) ?? '',
    locationName: relatedName(booking.location) ?? '',
    addons: (booking.booking_addons ?? []).map(item => relatedName(item.addon)).filter((name): name is string => Boolean(name)),
    requests: [booking.special_requests, booking.retouch_notes].map(request => request?.trim()).filter((request): request is string => Boolean(request)),
  };
}

function renderCustomerEmail(booking: BookingForEmail): EmailContent {
  return renderBookingConfirmation(confirmationBooking(booking));
}

function sender(): string {
  return normalizeResendSender(process.env.RESEND_FROM_EMAIL, process.env.RESEND_FROM_NAME?.trim() || 'Studio ON');
}

function idempotencyKey(bookingId: string, type: string, recipient: string): string {
  if (type === 'customer') return `booking-${bookingId}-customer-confirmation`;
  throw new Error('Only customer confirmation emails are enabled');
}

async function claimNotification(
  bookingId: string,
  recipientType: 'customer' | 'staff',
  recipientEmail: string,
): Promise<DeliveryClaim | null> {
  const supabase = getAdminSupabase();
  const normalizedEmail = recipientEmail.trim().toLowerCase();
  // One deterministic primary key per customer booking, independent of email.
  // PostgreSQL's existing unique primary key serializes concurrent webhook and
  // success-page attempts without a new function or schema permission.
  const id = uuidV5(`studio-on:booking-email:${bookingId}:${recipientType}${recipientType === 'staff' ? `:${normalizedEmail}` : ''}`, uuidV5.URL);
  const token = randomUUID();
  const values = {
    id, booking_id: bookingId, recipient_type: recipientType,
    recipient_email: normalizedEmail, status: 'sending', attempt_token: token,
    attempt_count: 1, attempted_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  };

  // Respect receipts made by the older server and confirmations imported from
  // Gmail. Legacy failed records are held for reconciliation, never guessed.
  const previous = await supabase.from('booking_email_notifications')
    .select('id, status, attempt_token, attempt_count, last_error')
    .eq('booking_id', bookingId).eq('recipient_type', recipientType);
  if (previous.error) throw new Error('Could not read booking delivery history');
  const relevant = (previous.data ?? []).filter(row => recipientType === 'customer' || row.id === id);
  if (relevant.some(row => row.status === 'sent' || row.status === 'sending')) return null;
  if (relevant.some(row => row.id !== id)) {
    throw new Error('Legacy delivery outcome needs reconciliation before sending');
  }

  const inserted = await supabase.from('booking_email_notifications').insert(values);
  if (!inserted.error) return { id, token };
  if (inserted.error.code !== '23505') throw new Error('Could not claim booking notification');

  // Only our own explicit rejection can be retried. A compare-and-set update
  // permits one retry winner; 'sending' never expires, including after timeout.
  const current = relevant.find(row => row.id === id && row.status === 'failed');
  if (!current) return null;
  if (!current.last_error?.startsWith('EXPLICIT_REJECTION_V1: ')) throw new Error('Unverified rejection needs delivery reconciliation');
  const claimed = await supabase.from('booking_email_notifications')
    .update({ ...values, attempt_count: current.attempt_count + 1, last_error: null })
    .eq('id', id).eq('status', 'failed').eq('attempt_token', current.attempt_token)
    .select('id');
  if (claimed.error) throw new Error('Could not retry rejected booking notification');
  return claimed.data?.length === 1 ? { id, token } : null;
}

async function deliver(
  booking: BookingForEmail,
  recipientType: 'customer' | 'staff',
  recipientEmail: string,
  content: EmailContent,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) throw new Error('RESEND_API_KEY is not configured');

  // Validate configuration before claiming. A local configuration error cannot
  // have sent mail, whereas an HTTP timeout must remain permanently held.
  const from = sender();
  const updateClaim = async (claim: DeliveryClaim, values: Record<string, unknown>) => {
    const { data, error } = await getAdminSupabase()
      .from('booking_email_notifications')
      .update({ ...values, updated_at: new Date().toISOString() })
      .eq('id', claim.id).eq('attempt_token', claim.token).eq('status', 'sending')
      .select('id');
    if (error || data?.length !== 1) throw new Error('Could not persist email delivery outcome');
  };
  await deliverClaimedEmail({
    claim: () => claimNotification(booking.id, recipientType, recipientEmail),
    send: async () => {
      const response = await fetch(RESEND_ENDPOINT, {
        method: 'POST',
        signal: AbortSignal.timeout(20_000),
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey(booking.id, recipientType, recipientEmail),
        },
        body: JSON.stringify({
          from, to: [recipientEmail],
          reply_to: process.env.RESEND_REPLY_TO_EMAIL?.trim() || 'studio.on.snap@gmail.com',
          subject: content.subject, html: content.html, text: content.text,
          tags: [{ name: 'booking_id', value: booking.id }, { name: 'recipient_type', value: recipientType }],
        }),
      });
      const result = await response.json() as { id?: string; message?: string; error?: { message?: string } };
      return { ok: response.ok, status: response.status, id: result.id, message: result.message || result.error?.message };
    },
    sent: (claim, messageId) => updateClaim(claim, { status: 'sent', resend_email_id: messageId, sent_at: new Date().toISOString(), last_error: null }),
    rejected: (claim, reason) => updateClaim(claim, { status: 'failed', last_error: `EXPLICIT_REJECTION_V1: ${reason}` }),
    // Keep 'sending' after uncertain outcomes. Even after days, retries must
    // reconcile the provider receipt instead of risking another customer mail.
    uncertain: (claim, reason) => updateClaim(claim, { last_error: reason }),
  });
}

export async function sendBookingNotifications(bookingId: string): Promise<void> {
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') return;
  if (!process.env.RESEND_API_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Booking email notifications are not configured');
  }

  const supabase = getAdminSupabase();
  const { data: bookingData, error: bookingError } = await supabase
    .from('bookings')
    .select(`
      id, reference, client_name, client_email, client_phone, client_country,
      special_requests, retouch_notes, date, start_minutes, end_minutes,
      extra_duration_minutes, group_size, status, payment_status, total_price,
      stripe_payment_intent_id, stripe_checkout_session_id,
      plan:plans(name), location:locations(name),
      assigned_member:members!bookings_assigned_member_id_fkey(name),
      booking_addons(price_snapshot, addon:addons(name))
    `)
    .eq('id', bookingId)
    .maybeSingle();

  if (bookingError || !bookingData) {
    throw new Error('Booking email lookup failed');
  }

  const booking = bookingData as unknown as BookingForEmail;
  if (!booking.stripe_payment_intent_id || !booking.stripe_checkout_session_id) return;
  // Read Stripe directly, then cross-check the same canonical booking rows
  // Membercheck displays. Never trust only the webhook's embedded snapshot.
  const [payment, checkout] = await Promise.all([
    stripe.paymentIntents.retrieve(booking.stripe_payment_intent_id, { expand: ['latest_charge'] }),
    stripe.checkout.sessions.retrieve(booking.stripe_checkout_session_id),
  ]);
  const checkoutPaymentId = typeof checkout.payment_intent === 'string' ? checkout.payment_intent : checkout.payment_intent?.id;
  if (checkoutPaymentId !== payment.id || checkout.client_reference_id !== booking.id || checkout.metadata?.booking_id !== booking.id || checkout.metadata?.booking_reference !== booking.reference || checkout.payment_status !== 'paid' || checkout.currency !== payment.currency) {
    console.warn('[booking-email] Checkout and booking mismatch', booking.reference);
    return;
  }
  const charge = payment.latest_charge;
  if (!charge || typeof charge === 'string') throw new Error('Payment charge could not be verified');
  const reason = confirmationIneligibility(confirmationBooking(booking), {
    id: payment.id, created: payment.created, status: payment.status,
    currency: payment.currency, amountReceived: payment.amount_received,
    amountBeforeDiscount: checkout.amount_subtotal ?? undefined, amountExpected: checkout.amount_total ?? undefined,
    bookingId: payment.metadata.booking_id, reference: payment.metadata.booking_reference,
    kind: payment.metadata.kind, paid: charge.paid,
    refunded: charge.refunded || charge.amount_refunded > 0, disputed: charge.disputed,
    billingEmail: charge.billing_details.email,
  });
  if (reason) {
    console.info('[booking-email] Confirmation skipped', booking.reference, reason);
    return;
  }

  // This workflow is authorized to send one customer confirmation only.
  await deliver(booking, 'customer', booking.client_email.trim(), renderCustomerEmail(booking));
}
