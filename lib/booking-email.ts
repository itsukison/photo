import 'server-only';

import { createHash } from 'node:crypto';
import { getAdminSupabase } from '@/lib/supabase-server';

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
  payment_status: string;
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

const MEETING_POINTS: Record<string, { name: string; url: string; note?: string }> = {
  shibuya: {
    name: 'In front of the Hachiko Statue',
    url: 'https://maps.app.goo.gl/fYHE22SnFcjZqNxk6',
  },
  shinjuku: {
    name: 'Cat Board (The Giant 3D Cat)',
    url: 'https://maps.app.goo.gl/tBoZTDDmpkzKypaeA',
    note: 'Right below the cat board building.',
  },
  akihabara: {
    name: 'NewDays',
    url: 'https://maps.app.goo.gl/77MHjzRc7HYUhuPR8?g_st=ic',
    note: 'Please meet in front of NewDays, right outside the Electric Town South Exit at Akihabara Station.',
  },
};

function relatedName(value: RelatedName): string | null {
  if (Array.isArray(value)) return value[0]?.name ?? null;
  return value?.name ?? null;
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatMinutes(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

function formatClock(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const minutePart = String(minutes % 60).padStart(2, '0');
  const period = hours >= 12 ? 'PM' : 'AM';
  const hourPart = hours % 12 || 12;
  return `${hourPart}:${minutePart} ${period}`;
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(`${date}T00:00:00+09:00`));
}

function emailRows(booking: BookingForEmail, internal: boolean): Array<[string, string]> {
  const addons = (booking.booking_addons ?? [])
    .map((item) => relatedName(item.addon))
    .filter((name): name is string => Boolean(name))
    .join(', ');

  const rows: Array<[string, string]> = [
    ['Booking reference', booking.reference],
    ['Session', relatedName(booking.plan) ?? 'Photo session'],
    ['Date', `${formatDate(booking.date)} (Tokyo time)`],
    ['Time', `${formatMinutes(booking.start_minutes)}–${formatMinutes(booking.end_minutes)} JST`],
    ['Location', relatedName(booking.location) ?? 'To be confirmed'],
    ['Group size', `${booking.group_size} ${booking.group_size === 1 ? 'person' : 'people'}`],
    ['Extra duration', booking.extra_duration_minutes ? `${booking.extra_duration_minutes} minutes` : 'None'],
    ['Add-ons', addons || 'None'],
    ['Total paid', `$${Number(booking.total_price).toFixed(2)} USD`],
    ['Assigned worker', relatedName(booking.assigned_member) ?? 'Unassigned'],
    ['Special requests', booking.special_requests?.trim() || 'None'],
    ['Retouch notes', booking.retouch_notes?.trim() || 'None'],
  ];

  if (internal) {
    rows.splice(1, 0,
      ['Customer', booking.client_name],
      ['Customer email', booking.client_email],
      ['Customer phone', booking.client_phone || 'Not provided'],
      ['Customer country', booking.client_country || 'Not provided'],
    );
  }

  return rows;
}

function renderEmail(booking: BookingForEmail, internal: boolean): EmailContent {
  if (!internal) return renderCustomerEmail(booking);

  const rows = emailRows(booking, internal);
  const heading = 'New paid booking';
  const intro = 'A new booking has been paid and is ready for review in Membercheck.';

  const htmlRows = rows.map(([label, value]) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #e8e6e1;color:#666;vertical-align:top">${escapeHtml(label)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e8e6e1;color:#111;font-weight:600;vertical-align:top">${escapeHtml(value)}</td>
    </tr>`).join('');

  return {
    subject: `New booking ${booking.reference} — ${booking.client_name}`,
    html: `<!doctype html>
<html><body style="margin:0;background:#f7f6f3;font-family:Arial,sans-serif;color:#111">
  <div style="max-width:640px;margin:0 auto;padding:32px 16px">
    <div style="background:#fff;border:1px solid #e8e6e1;border-radius:12px;padding:28px">
      <p style="margin:0 0 8px;color:#777;font-size:13px;letter-spacing:.08em;text-transform:uppercase">@ Studio ON</p>
      <h1 style="margin:0 0 16px;font-size:28px">${escapeHtml(heading)}</h1>
      <p style="margin:0 0 24px;line-height:1.6;color:#444">${escapeHtml(intro)}</p>
      <table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px">${htmlRows}</table>
    </div>
  </div>
</body></html>`,
    text: `${heading}\n\n${intro}\n\n${rows.map(([label, value]) => `${label}: ${value}`).join('\n')}`,
  };
}

function renderCustomerEmail(booking: BookingForEmail): EmailContent {
  const plan = relatedName(booking.plan) ?? 'photo session';
  const location = relatedName(booking.location) ?? 'Tokyo';
  const duration = Math.max(0, booking.end_minutes - booking.start_minutes);
  const meetingPoint = MEETING_POINTS[location.toLowerCase()];
  const addons = (booking.booking_addons ?? [])
    .map((item) => relatedName(item.addon))
    .filter((name): name is string => Boolean(name));
  const requests = [booking.special_requests, booking.retouch_notes]
    .map((request) => request?.trim())
    .filter((request): request is string => Boolean(request));

  const meetingText = meetingPoint
    ? `📍 Meeting Point (${location}):\n${meetingPoint.name}\n${meetingPoint.url}${meetingPoint.note ? `\n${meetingPoint.note}` : ''}`
    : `📍 Meeting Point (${location}):\nWe will share the exact meeting point with you via WhatsApp before the session.`;
  const addonsText = addons.length
    ? `\n\nWe have also confirmed your add-ons:\n\n${addons.map((addon) => `✅ ${addon}`).join('\n')}`
    : '';
  const requestsText = requests.length
    ? `\n\nWe have noted your requests:\n\n${requests.map((request) => `• ${request}`).join('\n')}`
    : '';

  const text = `Hi,
This is Studio ON 😊

Your booking for the ${plan} in ${location} is confirmed for:

📅 ${formatDate(booking.date)}
🕖 ${formatClock(booking.start_minutes)} – ${formatClock(booking.end_minutes)} (${duration}min)

${meetingText}${addonsText}${requestsText}

We will contact you via WhatsApp before the session for final coordination and easier communication with your photographer on the day of the shoot.

Please make sure your WhatsApp notifications are enabled and that you are reachable there, as all last-minute updates and meeting coordination on the day of the shoot will be handled through WhatsApp.

If you have any questions or expect to be late, feel free to reply anytime.

Looking forward to meeting you and creating amazing photos together!

Best,
Studio ON
📧 studio.on.snap@gmail.com
IG: @studio.on.snap
TikTok: @studio.on.snap`;

  const meetingHtml = meetingPoint
    ? `<p style="margin:0 0 6px"><strong>📍 Meeting Point (${escapeHtml(location)}):</strong></p>
       <p style="margin:0 0 6px">${escapeHtml(meetingPoint.name)}</p>
       <p style="margin:0 0 6px"><a href="${escapeHtml(meetingPoint.url)}" style="color:#111;text-decoration:underline">${escapeHtml(meetingPoint.url)}</a></p>
       ${meetingPoint.note ? `<p style="margin:0">${escapeHtml(meetingPoint.note)}</p>` : ''}`
    : `<p style="margin:0"><strong>📍 Meeting Point (${escapeHtml(location)}):</strong><br>We will share the exact meeting point with you via WhatsApp before the session.</p>`;
  const addonsHtml = addons.length
    ? `<div style="margin-top:28px"><p>We have also confirmed your add-ons:</p>${addons.map((addon) => `<p style="margin:6px 0">✅ ${escapeHtml(addon)}</p>`).join('')}</div>`
    : '';
  const requestsHtml = requests.length
    ? `<div style="margin-top:28px"><p>We have noted your requests:</p>${requests.map((request) => `<p style="margin:6px 0">• ${escapeHtml(request)}</p>`).join('')}</div>`
    : '';

  return {
    subject: `Your Studio ON booking is confirmed — ${booking.reference}`,
    html: `<!doctype html>
<html><body style="margin:0;background:#f7f6f3;font-family:Arial,sans-serif;color:#111">
  <div style="max-width:640px;margin:0 auto;padding:32px 16px">
    <div style="background:#fff;border:1px solid #e8e6e1;border-radius:12px;padding:28px;font-size:16px;line-height:1.6">
      <p style="margin:0 0 18px">Hi,<br>This is Studio ON 😊</p>
      <p>Your booking for the <strong>${escapeHtml(plan)}</strong> in <strong>${escapeHtml(location)}</strong> is confirmed for:</p>
      <p style="margin:22px 0">
        📅 ${escapeHtml(formatDate(booking.date))}<br>
        🕖 ${escapeHtml(formatClock(booking.start_minutes))} – ${escapeHtml(formatClock(booking.end_minutes))} (${duration}min)
      </p>
      <div style="margin:26px 0">${meetingHtml}</div>
      ${addonsHtml}
      ${requestsHtml}
      <p style="margin-top:30px">We will contact you via WhatsApp before the session for final coordination and easier communication with your photographer on the day of the shoot.</p>
      <p>Please make sure your WhatsApp notifications are enabled and that you are reachable there, as all last-minute updates and meeting coordination on the day of the shoot will be handled through WhatsApp.</p>
      <p>If you have any questions or expect to be late, feel free to reply anytime.</p>
      <p>Looking forward to meeting you and creating amazing photos together!</p>
      <p style="margin-bottom:0">Best,<br>Studio ON<br>📧 <a href="mailto:studio.on.snap@gmail.com" style="color:#111">studio.on.snap@gmail.com</a><br>IG: @studio.on.snap<br>TikTok: @studio.on.snap</p>
    </div>
  </div>
</body></html>`,
    text,
  };
}

function sender(): string {
  const email = process.env.RESEND_FROM_EMAIL?.trim();
  if (!email) throw new Error('RESEND_FROM_EMAIL is not configured');
  const name = process.env.RESEND_FROM_NAME?.trim() || '@ Studio ON';
  return `${name} <${email}>`;
}

function idempotencyKey(bookingId: string, type: string, recipient: string): string {
  const recipientHash = createHash('sha256').update(recipient.toLowerCase()).digest('hex').slice(0, 20);
  return `booking-${bookingId}-${type}-${recipientHash}`;
}

async function claimNotification(
  bookingId: string,
  recipientType: 'customer' | 'staff',
  recipientEmail: string,
): Promise<{ id: string; token: string } | null> {
  const supabase = getAdminSupabase();
  const normalizedEmail = recipientEmail.trim().toLowerCase();
  const { data, error } = await supabase.rpc('claim_booking_email_notification', {
    p_booking_id: bookingId,
    p_recipient_type: recipientType,
    p_recipient_email: normalizedEmail,
  });
  if (error) throw new Error(`Could not claim notification: ${error.message}`);

  const claim = (data as Array<{ notification_id: string; claim_token: string }> | null)?.[0];
  return claim ? { id: claim.notification_id, token: claim.claim_token } : null;
}

async function deliver(
  booking: BookingForEmail,
  recipientType: 'customer' | 'staff',
  recipientEmail: string,
  content: EmailContent,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) throw new Error('RESEND_API_KEY is not configured');

  const claim = await claimNotification(booking.id, recipientType, recipientEmail);
  if (!claim) return;

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey(booking.id, recipientType, recipientEmail),
      },
      body: JSON.stringify({
        from: sender(),
        to: [recipientEmail],
        reply_to: process.env.RESEND_REPLY_TO_EMAIL?.trim() || process.env.RESEND_FROM_EMAIL?.trim(),
        subject: content.subject,
        html: content.html,
        text: content.text,
        tags: [
          { name: 'booking_id', value: booking.id },
          { name: 'recipient_type', value: recipientType },
        ],
      }),
    });

    const result = await response.json() as { id?: string; message?: string; error?: { message?: string } };
    if (!response.ok || !result.id) {
      throw new Error(result.message || result.error?.message || `Resend returned ${response.status}`);
    }

    await getAdminSupabase()
      .from('booking_email_notifications')
      .update({
        status: 'sent',
        resend_email_id: result.id,
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', claim.id)
      .eq('attempt_token', claim.token);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await getAdminSupabase()
      .from('booking_email_notifications')
      .update({
        status: 'failed',
        last_error: message.slice(0, 2000),
        updated_at: new Date().toISOString(),
      })
      .eq('id', claim.id)
      .eq('attempt_token', claim.token);
    throw error;
  }
}

export async function sendBookingNotifications(bookingId: string): Promise<void> {
  if (!process.env.RESEND_API_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[booking-email] Email notifications are not configured');
    return;
  }

  const supabase = getAdminSupabase();
  const [{ data: bookingData, error: bookingError }, { data: members, error: membersError }] = await Promise.all([
    supabase
      .from('bookings')
      .select(`
        id, reference, client_name, client_email, client_phone, client_country,
        special_requests, retouch_notes, date, start_minutes, end_minutes,
        extra_duration_minutes, group_size, payment_status, total_price,
        plan:plans(name),
        location:locations(name),
        assigned_member:members!bookings_assigned_member_id_fkey(name),
        booking_addons(price_snapshot, addon:addons(name))
      `)
      .eq('id', bookingId)
      .maybeSingle(),
    supabase
      .from('members')
      .select('email')
      .eq('status', 'Active'),
  ]);

  if (bookingError || !bookingData) {
    console.error('[booking-email] Booking lookup failed', bookingError?.message ?? bookingId);
    return;
  }
  if (membersError) {
    console.error('[booking-email] Active member lookup failed', membersError.message);
  }

  const booking = bookingData as unknown as BookingForEmail;
  if (booking.payment_status !== 'paid') {
    console.warn('[booking-email] Refusing to email for unpaid booking', bookingId);
    return;
  }

  const recipients = Array.from(new Set(
    (members ?? [])
      .map((member) => String(member.email ?? '').trim().toLowerCase())
      .filter(Boolean),
  ));

  const jobs: Array<Promise<void>> = [];
  if (booking.client_email?.trim()) {
    jobs.push(deliver(booking, 'customer', booking.client_email.trim(), renderEmail(booking, false)));
  }
  for (const email of recipients) {
    jobs.push(deliver(booking, 'staff', email, renderEmail(booking, true)));
  }

  const results = await Promise.allSettled(jobs);
  const failures = results.filter((result) => result.status === 'rejected');
  if (failures.length) {
    console.error(`[booking-email] ${failures.length} of ${jobs.length} notification(s) failed`);
  }
}
