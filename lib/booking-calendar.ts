import { createHmac, timingSafeEqual } from 'node:crypto';

export const CALENDAR_IDS: Record<string, string> = {
  'f199ad72-aa43-4c35-a62f-fc54f56da991': '5a9af2029d9acf9f924d57237228993a4cd22f10f909e74e26a0488bac93158e@group.calendar.google.com',
  '73257ee0-2b82-412a-bcf4-ca5f1970e777': 'ab20356bdd04b3ac14b987dec1b69808c612a2635ee9980a71794fbf8ea08173@group.calendar.google.com',
};

type RelatedName = { name: string } | { name: string }[] | null;
export type CalendarBooking = {
  id: string; reference: string; date: string; start_minutes: number; end_minutes: number;
  client_name: string; client_email: string; client_phone: string | null;
  special_requests: string | null; retouch_notes: string | null; group_size: number;
  assigned_member_id: string | null; status: string; payment_status: string;
  payment_confirmed: boolean; cancelled_at: string | null;
  plans: RelatedName; locations: RelatedName; members: RelatedName;
  booking_addons: { addons: RelatedName }[];
};

export function tokyoDate(now = Date.now()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(now));
}

export function calendarFeedAuthorized(secret: string | undefined, timestamp: string | null, signature: string | null, now = Date.now()): boolean {
  if (!secret || secret.length < 32 || !timestamp || !/^\d{13}$/.test(timestamp) || !signature || Math.abs(now - Number(timestamp)) > 300_000) return false;
  const expected = createHmac('sha256', secret).update(timestamp).digest('base64url');
  const supplied = Buffer.from(signature);
  return supplied.length === Buffer.byteLength(expected) && timingSafeEqual(supplied, Buffer.from(expected));
}

function name(value: RelatedName): string { return (Array.isArray(value) ? value[0]?.name : value?.name)?.trim() ?? ''; }
function dateTime(date: string, minutes: number): string {
  return new Date(Date.parse(date + 'T00:00:00+09:00') + minutes * 60_000).toISOString();
}

export function calendarRecord(booking: CalendarBooking, today: string) {
  if (booking.date < today) return null;
  if (!/^[0-9a-f-]{36}$/i.test(booking.id) || !/^SHN-[A-Z0-9]+$/.test(booking.reference)) throw new Error('Invalid booking identity');
  const active = ['pending_confirmation', 'confirmed'].includes(booking.status) && booking.payment_status === 'paid' && !booking.cancelled_at && booking.client_email.trim().toLowerCase() !== 'studio.on.snap@gmail.com';
  // completed means refunded in Membercheck, per the owner's explicit rule.
  if (!active) return { bookingId: booking.id, reference: booking.reference, active: false };
  const calendarId = CALENDAR_IDS[booking.assigned_member_id ?? ''];
  if (!calendarId) return { bookingId: booking.id, reference: booking.reference, active: true, holdReason: 'Photographer calendar needs assignment or mapping' };
  if (!Number.isInteger(booking.start_minutes) || !Number.isInteger(booking.end_minutes) || booking.start_minutes < 0 || booking.start_minutes >= 1440 || booking.end_minutes <= booking.start_minutes || booking.end_minutes > 2880 || !/^\d{4}-\d{2}-\d{2}$/.test(booking.date)) throw new Error('Invalid session time for ' + booking.reference);
  const session = name(booking.plans), location = name(booking.locations), photographer = name(booking.members);
  if (!session || !location || !photographer || !booking.client_name.trim()) throw new Error('Incomplete booking for ' + booking.reference);
  const addons = booking.booking_addons.map(a => name(a.addons)).filter(Boolean).join(', ') || 'None';
  return {
    bookingId: booking.id, reference: booking.reference, active: true, calendarId,
    eventId: 'son' + booking.id.replace(/-/g, '').toLowerCase(),
    event: {
      summary: `${booking.client_name.trim()} | ${session} | ${location}`,
      location: `${location}, Tokyo, Japan`,
      description: [
        'Studio ON booking', 'Booking reference: ' + booking.reference, 'Photographer: ' + photographer,
        'Session: ' + session, 'Customer: ' + booking.client_name.trim(), 'Guests: ' + booking.group_size,
        'Email: ' + booking.client_email.trim(), 'WhatsApp / phone: ' + (booking.client_phone || 'Not provided'),
        'Add-ons: ' + addons, 'Requests: ' + (booking.special_requests?.trim() || 'None'),
        'Retouch notes: ' + (booking.retouch_notes?.trim() || 'None'), 'Membercheck status: ' + booking.status,
        'Source: https://membercheck.vercel.app/bookings', 'Studio ON Booking ID: ' + booking.id,
      ].join('\n'),
      start: { dateTime: dateTime(booking.date, booking.start_minutes), timeZone: 'Asia/Tokyo' },
      end: { dateTime: dateTime(booking.date, booking.end_minutes), timeZone: 'Asia/Tokyo' },
      attendees: [], conferenceData: null, transparency: 'opaque',
      extendedProperties: { private: { studio_on_booking_id: booking.id, studio_on_sync: 'v1' } },
    },
  };
}
