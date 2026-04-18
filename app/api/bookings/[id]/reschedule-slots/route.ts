// GET /api/bookings/[id]/reschedule-slots?date=yyyy-MM-dd
// Returns the candidate start times available for the booking at the given date.
// Uses get_reschedule_slots which excludes the booking's own slot from conflicts.

import { NextRequest, NextResponse } from 'next/server';
import { getUserSupabase } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const url = new URL(req.url);
  const date = url.searchParams.get('date');
  if (!date) return NextResponse.json({ error: 'date parameter required' }, { status: 400 });

  const supabase = getUserSupabase(req.headers.get('authorization'));
  const { data, error } = await supabase.rpc('get_reschedule_slots', {
    p_booking_id: id,
    p_date: date,
  });
  if (error) {
    const status = error.message.includes('FORBIDDEN') ? 403 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }
  return NextResponse.json({ slots: (data as string[]) ?? [] });
}
