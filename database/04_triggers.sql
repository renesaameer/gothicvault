-- ============================================================================
-- 04 — Triggers
-- ============================================================================

-- New auth user → create profile row
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users for each row execute function public.handle_new_user();

-- updated_at maintenance on every mutable table
do $$
declare t text;
begin
  for t in select unnest(array[
    'profiles','brands','categories','products','product_variants','orders','customers',
    'policies','hero_slides','shop_settings','footer_settings','contact_settings',
    'design_settings','invoice_settings','whatsapp_settings','floating_icons_settings',
    'announcement_bar','about_sections','homepage_sections','incomplete_orders'
  ]) loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.update_updated_at_column()', t);
  end loop;
end $$;

-- Admin notification triggers
drop trigger if exists trg_notify_new_order on public.orders;
create trigger trg_notify_new_order
after insert on public.orders
for each row execute function public.notify_new_order();

drop trigger if exists trg_notify_new_incomplete_order on public.incomplete_orders;
create trigger trg_notify_new_incomplete_order
after insert on public.incomplete_orders
for each row execute function public.notify_new_incomplete_order();

-- Enable realtime broadcast for admin notifications (idempotent)
do $$ begin
  begin
    alter publication supabase_realtime add table public.admin_notifications;
  exception when duplicate_object then null;
  end;
end $$;

-- Performance indexes for unread badge queries + cleanup scans
create index if not exists idx_admin_notifications_seen_created
  on public.admin_notifications (admin_seen, created_at desc);
create index if not exists idx_admin_notifications_type_created
  on public.admin_notifications (type, created_at desc);

-- Daily cleanup of old notifications (03:15 UTC). Requires pg_cron.
do $$
declare _jobid bigint;
begin
  select jobid into _jobid from cron.job where jobname = 'prune-admin-notifications';
  if _jobid is not null then perform cron.unschedule(_jobid); end if;
  perform cron.schedule(
    'prune-admin-notifications',
    '15 3 * * *',
    $cron$ select public.prune_admin_notifications(); $cron$
  );
exception when undefined_table or undefined_function or invalid_schema_name then
  -- pg_cron not available in this environment; skip silently.
  null;
end $$;