// Customer confirmations share the authoritative Membercheck booking record.
// Akayla and all earlier Stripe payments were already emailed outside this service.
export const CONFIRMATION_PAYMENT_CUTOFF = 1795315970;
export const CONFIRMATION_ANCHOR_REFERENCE = 'SHN-BD06CAA6';

export type ConfirmationBooking = {
  id: string;
  reference: string;
  client_email: string;
  date: string;
  start_minutes: number;
  end_minutes: number;
  group_size: number;
  status: string;
  payment_status: string;
  total_price: number;
  stripe_payment_intent_id: string | null;
  sessionName: string;
  locationName: string;
  addons: string[];
  requests: string[];
};

export type ConfirmationPayment = {
  id: string;
  created: number;
  status: string;
  currency: string;
  amountReceived: number;
  bookingId?: string;
  reference?: string;
  kind?: string;
  paid: boolean;
  refunded: boolean;
  disputed: boolean;
  billingEmail?: string | null;
};

export type EmailContent = { subject: string; html: string; text: string };

const MEETING_POINTS: Record<string, { text: string; url: string }> = {
  shibuya: { text: 'In front of the Hachiko Statue', url: 'https://maps.app.goo.gl/fYHE22SnFcjZqNxk6' },
  shinjuku: { text: 'Cat Board (The Giant 3D Cat)\nRight below the cat board building', url: 'https://maps.app.goo.gl/tBoZTDDmpkzKypaeA' },
};

const POSING_REPLY = 'For posing, just ask your photographer for guidance when they contact you. They’ll be happy to help!';
const OUTFIT_REPLY = 'For outfits, try to avoid white and go for a mix of colors. Accessories like sunglasses can make your look even more stylish, so feel free to bring plenty 😊';

export function escapeEmailHtml(value: unknown): string {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

export function confirmationIneligibility(booking: ConfirmationBooking, payment: ConfirmationPayment, now = Date.now()): string | null {
  if (booking.reference === CONFIRMATION_ANCHOR_REFERENCE || payment.created <= CONFIRMATION_PAYMENT_CUTOFF) return 'already-handled-payment';
  if (payment.kind !== 'booking' || payment.bookingId !== booking.id || payment.reference !== booking.reference || payment.id !== booking.stripe_payment_intent_id) return 'payment-booking-mismatch';
  if (booking.payment_status !== 'paid' || !['pending_confirmation', 'confirmed'].includes(booking.status)) return 'booking-not-ready';
  if (payment.status !== 'succeeded' || !payment.paid || payment.refunded || payment.disputed) return 'payment-not-clear';
  if (payment.currency !== 'usd' || !Number.isFinite(booking.total_price) || payment.amountReceived !== Math.round(booking.total_price * 100)) return 'payment-amount-mismatch';
  if (!/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(booking.client_email)) return 'invalid-recipient';
  if (payment.billingEmail && payment.billingEmail.trim().toLowerCase() !== booking.client_email.trim().toLowerCase()) return 'payment-email-mismatch';
  if (!MEETING_POINTS[booking.locationName.trim().toLowerCase()]) return 'meeting-point-needs-review';
  if (!booking.sessionName || !Number.isInteger(booking.group_size) || booking.group_size < 1 || !Number.isInteger(booking.start_minutes) || !Number.isInteger(booking.end_minutes) || booking.start_minutes < 0 || booking.end_minutes > 1440 || booking.end_minutes <= booking.start_minutes) return 'invalid-session-details';
  const shootStart = Date.parse(`${booking.date}T00:00:00+09:00`) + booking.start_minutes * 60_000;
  if (!Number.isFinite(shootStart) || shootStart <= now) return 'session-not-in-future';
  return null;
}

function clock(minutes: number): string {
  const hour = Math.floor(minutes / 60) % 24;
  return `${hour % 12 || 12}:${String(minutes % 60).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
}

export function renderBookingConfirmation(booking: ConfirmationBooking): EmailContent {
  const meeting = MEETING_POINTS[booking.locationName.trim().toLowerCase()];
  if (!meeting) throw new Error('Meeting point needs review');
  const date = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Tokyo', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(`${booking.date}T00:00:00+09:00`));
  const time = `${clock(booking.start_minutes)} – ${clock(booking.end_minutes)} (${booking.end_minutes - booking.start_minutes}min)`;
  const guests = `${booking.group_size} ${booking.group_size === 1 ? 'person' : 'people'}`;
  const requests = booking.requests.map(request => request.trim()).filter(Boolean);
  const notes = requests.join('\n');
  const replies: string[] = [];
  if (/\b(?:pos(?:e|es|ing))\b/i.test(notes) && /\b(?:help|guidance|ideas?|need|suggestions?|please)\b/i.test(notes) && !/\b(?:no|don't need|do not need)\s+(?:help (?:with )?)?posing/i.test(notes)) replies.push(POSING_REPLY);
  if (/\b(?:outfits?|clothes|clothing|what to wear)\b/i.test(notes) && /\b(?:suggestions?|recommend|advice|ideas?|what|help|please)\b/i.test(notes)) replies.push(OUTFIT_REPLY);
  const addonsText = booking.addons.length ? `\n\nWe have also confirmed your add-ons:\n${booking.addons.map(addon => `✅ ${addon}`).join('\n')}` : '';
  const requestsText = requests.length ? `\n\nWe have noted your requests:\n${requests.map(request => `• ${request}`).join('\n')}${replies.length ? `\n\n${replies.join('\n\n')}` : ''}` : '';
  const coordination = 'We will contact you via WhatsApp 1–2 days before the session for final coordination and easier communication with your photographer on the day of the shoot.';
  const notifications = 'Please make sure your WhatsApp notifications are enabled and that you are reachable there, as all last-minute updates and meeting coordination on the day of the shoot will be handled through WhatsApp.';
  const questions = 'If you have any questions or expect to be late, feel free to reply anytime.';
  const closing = 'Looking forward to meeting you and creating amazing photos together!';
  const e = escapeEmailHtml;
  return {
    subject: 'Studio ON - Tokyo Photoshoot Booking Confirmation',
    text: `Hi,\n\nThis is Studio ON 😊\n\nYour booking for the ${booking.sessionName} in ${booking.locationName} is confirmed for:\n\n📅 ${date}\n🕣 ${time}\n👥 Number of Guests: ${guests}\n\n📍 Meeting Point (${booking.locationName}):\n${meeting.text}\n${meeting.url}${addonsText}${requestsText}\n\n${coordination}\n\n${notifications}\n\n${questions}\n\n${closing}\n\nBest,\nStudio ON\n📧 studio.on.snap@gmail.com\nIG: @studio.on.snap\nTikTok: @studio.on.snap`,
    html: `<div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:#222;background:#fff">
<p>Hi,</p><p>This is Studio ON 😊</p>
<p>Your booking for the <strong>${e(booking.sessionName)}</strong> in <strong>${e(booking.locationName)}</strong> is confirmed for:</p>
<p>📅 <strong>${e(date)}</strong><br>🕣 <strong>${e(time)}</strong><br>👥 <strong>Number of Guests:</strong> ${e(guests)}</p>
<p>📍 <strong>Meeting Point (${e(booking.locationName)}):</strong><br>${e(meeting.text).replaceAll('\n', '<br>')}<br><a href="${e(meeting.url)}">${e(meeting.url)}</a></p>
${booking.addons.length ? `<p>We have also confirmed your add-ons:</p><p>${booking.addons.map(addon => `✅ ${e(addon)}`).join('<br>')}</p>` : ''}
${requests.length ? `<p>We have noted your requests:</p><p>${requests.map(request => `• ${e(request).replaceAll('\n', '<br>')}`).join('<br>')}</p>${replies.map(reply => `<p>${e(reply)}</p>`).join('')}` : ''}
<p>We will contact you via <strong>WhatsApp 1–2 days before the session</strong> for final coordination and easier communication with your photographer on the day of the shoot.</p>
<p>Please make sure your WhatsApp <strong>notifications are enabled</strong> and that you are reachable there, as all last-minute updates and meeting coordination on the day of the shoot will be handled through WhatsApp.</p>
<p>${e(questions)}</p><p>${e(closing)}</p>
<p>Best,<br><strong>Studio ON</strong><br>📧 <a href="mailto:studio.on.snap@gmail.com">studio.on.snap@gmail.com</a><br>IG: @studio.on.snap<br>TikTok: @studio.on.snap</p></div>`,
  };
}

// Accept either a bare mailbox or the display-name form commonly copied into
// Vercel settings. Never wrap an already formatted sender in a second <...>.
export function normalizeResendSender(raw: string | undefined, displayName = 'Studio ON'): string {
  let value = raw?.trim() ?? '';
  if (/^(".*"|'.*')$/.test(value)) value = value.slice(1, -1).trim();
  if (!value || /[\r\n]/.test(value) || /[\r\n<>]/.test(displayName)) throw new Error('Invalid mail sender configuration');
  const formatted = /^(.*?)\s*<([^<>]+)>$/.exec(value);
  const address = (formatted ? formatted[2] : value).trim();
  const name = (formatted?.[1]?.trim() || displayName).replace(/^"(.*)"$/, '$1');
  if (!/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(address) || /[<>]/.test(name)) throw new Error('Invalid mail sender configuration');
  return `${name} <${address}>`;
}

export type DeliveryClaim = { id: string; token: string };
export type DeliveryDependencies = {
  claim: () => Promise<DeliveryClaim | null>;
  send: () => Promise<{ ok: boolean; status: number; id?: string; message?: string }>;
  sent: (claim: DeliveryClaim, messageId: string) => Promise<void>;
  rejected: (claim: DeliveryClaim, reason: string) => Promise<void>;
  uncertain: (claim: DeliveryClaim, reason: string) => Promise<void>;
};

export async function deliverClaimedEmail(deps: DeliveryDependencies): Promise<'sent' | 'skipped'> {
  const claim = await deps.claim();
  if (!claim) return 'skipped';
  let result;
  try {
    result = await deps.send();
  } catch {
    await deps.uncertain(claim, 'Delivery outcome unknown; automatic resend blocked.');
    throw new Error('Email delivery outcome needs manual review');
  }
  if (result.ok && result.id) {
    try {
      await deps.sent(claim, result.id);
    } catch {
      await deps.uncertain(claim, 'Provider accepted email but receipt persistence failed; automatic resend blocked.');
      throw new Error('Accepted email needs receipt reconciliation');
    }
    return 'sent';
  }
  // Only explicit rejections are safe to retry. Timeouts, 5xx, idempotency
  // conflicts and malformed success replies might already have sent the mail.
  if ([400, 401, 403, 404, 413, 422, 429].includes(result.status)) {
    await deps.rejected(claim, (result.message || `Mail provider rejected request (${result.status})`).slice(0, 1000));
  } else {
    await deps.uncertain(claim, 'Provider result ambiguous; automatic resend blocked.');
  }
  throw new Error('Email was not confirmed delivered');
}
