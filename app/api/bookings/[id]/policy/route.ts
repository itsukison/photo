// GET /api/bookings/[id]/policy
// Thin wrapper around the get_booking_policy RPC. Used by the profile page
// to show the customer exactly what will happen if they cancel or reschedule
// right now (refund amount, fee amount, whether it's blocked).

import { NextRequest, NextResponse } from 'next/server';
import { getUserSupabase } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = getUserSupabase(req.headers.get('authorization'));
  const { data, error } = await supabase.rpc('get_booking_policy', { p_booking_id: id });
  if (error) {
    const status = error.message.includes('FORBIDDEN') ? 403 : error.message.includes('BOOKING_NOT_FOUND') ? 404 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return NextResponse.json({ error: 'Policy unavailable' }, { status: 404 });
  return NextResponse.json(row);
}
