'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const ANALYTICS_SESSION_KEY = 'photo-analytics-session-id';

export function TrackCancellation() {
  useEffect(() => {
    (async () => {
      try {
        const sessionId = window.sessionStorage.getItem(ANALYTICS_SESSION_KEY);
        if (!sessionId) return;
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) return;
        fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            event_type: 'payment_cancelled',
            properties: {},
            session_id: sessionId,
          }),
        }).catch(() => {});
      } catch {
        // Never surface tracking errors
      }
    })();
  }, []);

  return null;
}
