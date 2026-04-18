// Per-request Supabase client for API routes.
// The browser already owns the user's session; we forward the JWT via the
// Authorization header so SECURITY DEFINER RPCs still see auth.uid().
// A separate anon client is used for webhook handlers which operate without
// a user context — those rely on the Stripe signature + unguessable session ids.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

/** Client that carries the caller's user JWT. Use for customer-initiated actions. */
export function getUserSupabase(authHeader: string | null | undefined): SupabaseClient {
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim();
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
  });
}

/** Anon client with no user context. Use only for webhook handlers. */
export function getAnonSupabase(): SupabaseClient {
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
