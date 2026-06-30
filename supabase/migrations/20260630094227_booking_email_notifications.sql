create table public.booking_email_notifications (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  recipient_type text not null check (recipient_type in ('customer', 'staff')),
  recipient_email text not null,
  status text not null default 'pending' check (status in ('pending', 'sending', 'sent', 'failed')),
  attempt_token uuid,
  attempt_count integer not null default 0,
  resend_email_id text,
  last_error text,
  attempted_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (booking_id, recipient_type, recipient_email)
);

create index booking_email_notifications_retry_idx
  on public.booking_email_notifications (status, attempted_at)
  where status <> 'sent';

alter table public.booking_email_notifications enable row level security;

revoke all on table public.booking_email_notifications from anon, authenticated;
grant select, insert, update on table public.booking_email_notifications to service_role;

comment on table public.booking_email_notifications is
  'Server-only delivery state for idempotent booking confirmation emails.';

create function public.claim_booking_email_notification(
  p_booking_id uuid,
  p_recipient_type text,
  p_recipient_email text
)
returns table (notification_id uuid, claim_token uuid)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_token uuid := gen_random_uuid();
begin
  insert into public.booking_email_notifications (
    booking_id,
    recipient_type,
    recipient_email
  )
  values (
    p_booking_id,
    p_recipient_type,
    lower(trim(p_recipient_email))
  )
  on conflict (booking_id, recipient_type, recipient_email) do nothing;

  return query
  update public.booking_email_notifications as notification
  set
    status = 'sending',
    attempt_token = v_token,
    attempt_count = notification.attempt_count + 1,
    attempted_at = now(),
    updated_at = now(),
    last_error = null
  where notification.booking_id = p_booking_id
    and notification.recipient_type = p_recipient_type
    and notification.recipient_email = lower(trim(p_recipient_email))
    and (
      notification.status in ('pending', 'failed')
      or (
        notification.status = 'sending'
        and notification.attempted_at < now() - interval '5 minutes'
      )
    )
  returning notification.id, notification.attempt_token;
end;
$$;

revoke all on function public.claim_booking_email_notification(uuid, text, text) from public;
revoke all on function public.claim_booking_email_notification(uuid, text, text) from anon, authenticated;
grant execute on function public.claim_booking_email_notification(uuid, text, text) to service_role;
