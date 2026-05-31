-- ============================================================================
-- Incomplete Order Recovery System
-- ============================================================================

create table if not exists public.incomplete_orders (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  customer_name text,
  phone text not null,
  email text,
  address jsonb not null default '{}'::jsonb,
  cart_items jsonb not null default '[]'::jsonb,
  subtotal numeric not null default 0,
  delivery_charge numeric not null default 0,
  total numeric not null default 0,
  coupon text,
  payment_method text,
  checkout_step text not null default 'started',
  recovery_status text not null default 'pending',
  recovered boolean not null default false,
  converted_order_id uuid,
  last_activity timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, phone)
);

create index if not exists idx_incomplete_orders_phone        on public.incomplete_orders(phone);
create index if not exists idx_incomplete_orders_session      on public.incomplete_orders(session_id);
create index if not exists idx_incomplete_orders_last_activity on public.incomplete_orders(last_activity desc);
create index if not exists idx_incomplete_orders_status       on public.incomplete_orders(recovery_status);
create index if not exists idx_incomplete_orders_recovered    on public.incomplete_orders(recovered);

alter table public.incomplete_orders enable row level security;

drop trigger if exists set_updated_at on public.incomplete_orders;
create trigger set_updated_at before update on public.incomplete_orders
  for each row execute function public.update_updated_at_column();

-- Admin/staff full access; public has NO direct table access (RPCs only)
drop policy if exists "admins_manage" on public.incomplete_orders;
create policy "admins_manage" on public.incomplete_orders for all to authenticated
  using (public.is_admin_or_staff(auth.uid()))
  with check (public.is_admin_or_staff(auth.uid()));

-- ── RPCs ────────────────────────────────────────────────────────────────────
-- Upsert by (session_id, phone). Validates a Bangladesh mobile number
-- (`01XXXXXXXXX`, exactly 11 digits starting with 01) and requires a non-empty
-- cart. Anything else is silently ignored — keeps admin clutter at zero.
create or replace function public.upsert_incomplete_order(
  _session_id   text,
  _phone        text,
  _customer_name text default null,
  _email        text default null,
  _address      jsonb default '{}'::jsonb,
  _cart_items   jsonb default '[]'::jsonb,
  _subtotal     numeric default 0,
  _delivery_charge numeric default 0,
  _total        numeric default 0,
  _coupon       text default null,
  _payment_method text default null,
  _checkout_step text default 'started'
) returns uuid
language plpgsql security definer set search_path to 'public' as $$
declare
  _id uuid;
  _digits text := regexp_replace(coalesce(_phone, ''), '\D', '', 'g');
begin
  -- Phone gate: 11 digits, BD mobile prefix 01
  if _digits !~ '^01[0-9]{9}$' then
    return null;
  end if;

  -- Cart gate: must have at least one item
  if _cart_items is null or jsonb_typeof(_cart_items) <> 'array' or jsonb_array_length(_cart_items) = 0 then
    return null;
  end if;

  -- Session gate
  if coalesce(trim(_session_id), '') = '' then
    return null;
  end if;

  insert into public.incomplete_orders (
    session_id, phone, customer_name, email, address, cart_items,
    subtotal, delivery_charge, total, coupon, payment_method,
    checkout_step, last_activity
  ) values (
    _session_id, _digits, _customer_name, _email, _address, _cart_items,
    _subtotal, _delivery_charge, _total, _coupon, _payment_method,
    coalesce(_checkout_step, 'started'), now()
  )
  on conflict (session_id, phone) do update set
    customer_name    = coalesce(nullif(excluded.customer_name, ''), public.incomplete_orders.customer_name),
    email            = coalesce(nullif(excluded.email, ''), public.incomplete_orders.email),
    address          = excluded.address,
    cart_items       = excluded.cart_items,
    subtotal         = excluded.subtotal,
    delivery_charge  = excluded.delivery_charge,
    total            = excluded.total,
    coupon           = excluded.coupon,
    payment_method   = excluded.payment_method,
    checkout_step    = excluded.checkout_step,
    last_activity    = now()
  where public.incomplete_orders.recovered = false
  returning id into _id;

  return _id;
end $$;

create or replace function public.mark_incomplete_order_recovered(
  _session_id text,
  _phone      text,
  _order_id   uuid
) returns void
language plpgsql security definer set search_path to 'public' as $$
declare
  _digits text := regexp_replace(coalesce(_phone, ''), '\D', '', 'g');
begin
  if _digits !~ '^01[0-9]{9}$' then return; end if;
  update public.incomplete_orders
     set recovered = true,
         recovery_status = 'recovered',
         converted_order_id = _order_id,
         last_activity = now()
   where phone = _digits
     and (session_id = _session_id or _session_id is null)
     and recovered = false;
end $$;

-- Grant execute to anon + authenticated for the public RPCs
grant execute on function public.upsert_incomplete_order(
  text, text, text, text, jsonb, jsonb, numeric, numeric, numeric, text, text, text
) to anon, authenticated;
grant execute on function public.mark_incomplete_order_recovered(text, text, uuid)
  to anon, authenticated;