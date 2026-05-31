
-- admin_notifications table
create table if not exists public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('order','incomplete_order')),
  reference_id uuid,
  customer_name text,
  amount numeric not null default 0,
  title text not null,
  message text,
  url text,
  admin_seen boolean not null default false,
  seen_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_notifications_unseen on public.admin_notifications(type, created_at desc) where admin_seen = false;
create index if not exists idx_admin_notifications_created on public.admin_notifications(created_at desc);

alter table public.admin_notifications enable row level security;

drop policy if exists "admins_select_notifications" on public.admin_notifications;
create policy "admins_select_notifications" on public.admin_notifications
  for select to authenticated using (public.is_admin_or_staff(auth.uid()));

drop policy if exists "admins_update_notifications" on public.admin_notifications;
create policy "admins_update_notifications" on public.admin_notifications
  for update to authenticated using (public.is_admin_or_staff(auth.uid())) with check (public.is_admin_or_staff(auth.uid()));

drop policy if exists "admins_delete_notifications" on public.admin_notifications;
create policy "admins_delete_notifications" on public.admin_notifications
  for delete to authenticated using (public.is_admin_or_staff(auth.uid()));

-- Triggers create notifications. Insert runs as the security context of the
-- row's writer; since the function does not return anything that depends on
-- caller perms it works for anon (orders) and definer RPC (incomplete_orders).

create or replace function public.notify_new_order()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  insert into public.admin_notifications (type, reference_id, customer_name, amount, title, message, url)
  values (
    'order',
    new.id,
    new.customer_name,
    coalesce(new.total, 0),
    'New order received',
    coalesce(new.order_number, '') || ' · ' || coalesce(new.customer_name, 'Customer'),
    '/admin/orders'
  );
  return new;
end $$;

drop trigger if exists trg_notify_new_order on public.orders;
create trigger trg_notify_new_order
after insert on public.orders
for each row execute function public.notify_new_order();

create or replace function public.notify_new_incomplete_order()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  -- The upsert RPC already gates on valid BD phone + non-empty cart.
  -- Only fire on first insert (not the auto-saves that update the same row).
  insert into public.admin_notifications (type, reference_id, customer_name, amount, title, message, url)
  values (
    'incomplete_order',
    new.id,
    new.customer_name,
    coalesce(new.total, 0),
    'New incomplete order',
    coalesce(new.customer_name, 'Customer') || ' · ' || coalesce(new.phone, ''),
    '/admin/incomplete-orders'
  );
  return new;
end $$;

drop trigger if exists trg_notify_new_incomplete_order on public.incomplete_orders;
create trigger trg_notify_new_incomplete_order
after insert on public.incomplete_orders
for each row execute function public.notify_new_incomplete_order();

-- RPC to mark a group as seen in one round-trip
create or replace function public.mark_admin_notifications_seen(_type text default null)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
  if not public.is_admin_or_staff(auth.uid()) then
    return;
  end if;
  update public.admin_notifications
     set admin_seen = true, seen_at = now()
   where admin_seen = false
     and (_type is null or type = _type);
end $$;

grant execute on function public.mark_admin_notifications_seen(text) to authenticated;

-- Enable realtime
alter publication supabase_realtime add table public.admin_notifications;
