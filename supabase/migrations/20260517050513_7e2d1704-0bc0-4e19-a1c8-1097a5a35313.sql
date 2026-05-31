-- Enable pg_cron (idempotent)
create extension if not exists pg_cron with schema extensions;

-- Index to speed up unread badge queries + cleanup scans
create index if not exists idx_admin_notifications_seen_created
  on public.admin_notifications (admin_seen, created_at desc);

create index if not exists idx_admin_notifications_type_created
  on public.admin_notifications (type, created_at desc);

-- Cleanup function: prune seen >7d, and ANY >30d
create or replace function public.prune_admin_notifications()
returns integer
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  _deleted integer := 0;
  _n integer;
begin
  delete from public.admin_notifications
   where admin_seen = true
     and created_at < now() - interval '7 days';
  get diagnostics _n = row_count;
  _deleted := _deleted + _n;

  delete from public.admin_notifications
   where created_at < now() - interval '30 days';
  get diagnostics _n = row_count;
  _deleted := _deleted + _n;

  return _deleted;
end $$;

-- Unschedule prior job if exists, then schedule daily at 03:15 UTC
do $$
declare _jobid bigint;
begin
  select jobid into _jobid from cron.job where jobname = 'prune-admin-notifications';
  if _jobid is not null then
    perform cron.unschedule(_jobid);
  end if;
  perform cron.schedule(
    'prune-admin-notifications',
    '15 3 * * *',
    $cron$ select public.prune_admin_notifications(); $cron$
  );
end $$;