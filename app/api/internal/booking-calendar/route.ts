import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase-server';
import { calendarFeedAuthorized, calendarRecord, tokyoDate, type CalendarBooking } from '@/lib/booking-calendar';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Read-only feed for the owner's Google Apps Script. The dedicated signing key
// cannot query Supabase or send mail; it is never included in a URL or response.
export async function GET(request: NextRequest) {
  const noStore = { 'Cache-Control': 'no-store, private' };
  if (!calendarFeedAuthorized(process.env.BOOKING_CALENDAR_SYNC_SECRET, request.headers.get('x-studio-on-timestamp'), request.headers.get('x-studio-on-signature'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noStore });
  }
  const today = tokyoDate();
  const rows: CalendarBooking[] = [];
  const db = getAdminSupabase();
  for (let offset = 0; offset < 10_000; offset += 250) {
    const { data, error } = await db.from('bookings').select(`
      id,reference,date,start_minutes,end_minutes,client_name,client_email,client_phone,
      special_requests,retouch_notes,group_size,assigned_member_id,status,payment_status,
      payment_confirmed,cancelled_at,plans(name),locations(name),members(name),booking_addons(addons(name))
    `).gte('date', today).order('date').order('id').range(offset, offset + 249);
    if (error) return NextResponse.json({ error: 'Booking lookup failed' }, { status: 503, headers: noStore });
    rows.push(...data as unknown as CalendarBooking[]);
    if (data.length < 250) {
      try {
        const bookings = rows.map(row => calendarRecord(row, today)).filter(Boolean);
        return NextResponse.json({ version: 'studio-on-calendar-v1', today, bookings }, { headers: noStore });
      } catch (error) {
        console.error('[booking-calendar]', error instanceof Error ? error.message : 'Invalid booking');
        return NextResponse.json({ error: 'Booking requires calendar review' }, { status: 503, headers: noStore });
      }
    }
  }
  return NextResponse.json({ error: 'Booking feed limit reached' }, { status: 503, headers: noStore });
}
