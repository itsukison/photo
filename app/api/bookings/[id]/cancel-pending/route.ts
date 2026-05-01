// POST /api/bookings/[id]/cancel-pending
// Customer cancels an unpaid pending_payment booking. No refund, no Stripe call —
// just releases the slot.

import { NextRequest, NextResponse } from 'next/server';
import { getUserSupabase } from '@/lib/supabase-server';

export const runtime = 'nodejs';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = getUserSupabase(req.headers.get('authorization'));

  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const { error } = await supabase.rpc('cancel_pending_payment', { p_booking_id: id });
  if (error) {
    const msg = error.message || 'Cancellation failed';
    if (msg.includes('BOOKING_NOT_CANCELLABLE')) {
      return NextResponse.json({ error: 'This booking cannot be cancelled.' }, { status: 409 });
    }
    if (msg.includes('NOT_AUTHENTICATED')) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
