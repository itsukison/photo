import { NextRequest, NextResponse } from 'next/server';
import { getUserSupabase } from '@/lib/supabase-server';

export const runtime = 'nodejs';

type EventBody = {
  event_type: string;
  properties?: Record<string, unknown>;
  session_id: string;
};

export async function POST(req: NextRequest) {
  let body: EventBody;
  try {
    body = (await req.json()) as EventBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.event_type || !body.session_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = getUserSupabase(req.headers.get('authorization'));
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  const { error } = await supabase.from('user_events').insert({
    tourist_id: userData.user.id,
    session_id: body.session_id,
    event_type: body.event_type,
    properties: body.properties ?? {},
  });

  if (error) {
    return NextResponse.json({ error: 'Failed to record event' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
