-- ============================================================================
-- 03 — Functions (helpers + domain RPCs)
-- All security definer functions pin search_path to 'public'.
-- ============================================================================

-- ──────────────── HELPERS ────────────────
create or replace function public.update_updated_at_column()
returns trigger language plpgsql set search_path to 'public' as $$
begin new.updated_at = now(); return new; end $$;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path to 'public' as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_admin_or_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path to 'public' as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role in ('admin','staff'))
$$;

-- ──────────────── AUTH BOOTSTRAP ────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  insert into public.profiles (user_id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)))
  on conflict (user_id) do nothing;
  return new;
end $$;

-- ──────────────── PUBLIC RPCs ────────────────
create or replace function public.subscribe_newsletter(_email text)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
  insert into public.newsletter_subscribers (email) values (lower(trim(_email)))
  on conflict (email) do nothing;
end $$;

create or replace function public.decrement_product_stock(_product_id uuid, _quantity integer)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
  update public.products set stock = greatest(0, stock - _quantity) where id = _product_id;
end $$;

create or replace function public.increment_coupon_usage(_code text)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
  update public.coupons set used_count = used_count + 1 where code = _code;
end $$;

create or replace function public.upsert_checkout_customer(
  _name text, _email text default null, _phone text default '',
  _order_total numeric default 0, _address text default null, _city text default null
) returns void language plpgsql security definer set search_path to 'public' as $$
declare existing_id uuid;
begin
  select id into existing_id from public.customers
   where (nullif(_phone,'') is not null and phone = _phone)
      or (nullif(_email,'') is not null and email = _email)
   limit 1;
  if existing_id is null then
    insert into public.customers (name, email, phone, address, city, total_orders, total_spent)
    values (_name, _email, coalesce(_phone,''), _address, _city, 1, coalesce(_order_total,0));
  else
    update public.customers set
      name = coalesce(nullif(_name,''), name),
      email = coalesce(nullif(_email,''), email),
      address = coalesce(nullif(_address,''), address),
      city = coalesce(nullif(_city,''), city),
      total_orders = total_orders + 1,
      total_spent = total_spent + coalesce(_order_total,0),
      updated_at = now()
    where id = existing_id;
  end if;
end $$;

create or replace function public.get_public_tracking_pixels()
returns table(platform text, pixel_id text)
language sql stable security definer set search_path to 'public' as $$
  select platform, pixel_id from public.tracking_pixels where enabled = true and pixel_id <> '';
$$;

create or replace function public.track_order(_order_number text)
returns table(order_number text, order_status text, payment_status text, payment_method text,
              total numeric, subtotal numeric, shipping_cost numeric, discount_amount numeric,
              items jsonb, tracking_number text, delivery_partner text,
              customer_name text, customer_city text,
              created_at timestamptz, updated_at timestamptz)
language sql stable security definer set search_path to 'public' as $$
  select order_number, order_status, payment_status, payment_method,
         total, subtotal, shipping_cost, discount_amount, items,
         tracking_number, delivery_partner, customer_name, customer_city,
         created_at, updated_at
  from public.orders where order_number = _order_number limit 1;
$$;

create or replace function public.track_orders_by_phone(_phone text)
returns table(order_number text, order_status text, payment_status text, payment_method text,
              total numeric, subtotal numeric, shipping_cost numeric, discount_amount numeric,
              items jsonb, tracking_number text, delivery_partner text,
              customer_name text, customer_city text,
              created_at timestamptz, updated_at timestamptz)
language sql stable security definer set search_path to 'public' as $$
  select order_number, order_status, payment_status, payment_method,
         total, subtotal, shipping_cost, discount_amount, items,
         tracking_number, delivery_partner, customer_name, customer_city,
         created_at, updated_at
  from public.orders where customer_phone = _phone
  order by created_at desc limit 20;
$$;

-- ──────────────── INCOMPLETE ORDER RECOVERY ────────────────
-- Upsert by (session_id, phone). Validates a Bangladesh mobile number
-- (`01XXXXXXXXX`, 11 digits) and requires at least one cart item.
-- Anything else silently returns null — keeps admin clutter at zero.
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
  if _digits !~ '^01[0-9]{9}$' then return null; end if;
  if _cart_items is null or jsonb_typeof(_cart_items) <> 'array' or jsonb_array_length(_cart_items) = 0 then
    return null;
  end if;
  if coalesce(trim(_session_id), '') = '' then return null; end if;

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

grant execute on function public.upsert_incomplete_order(
  text, text, text, text, jsonb, jsonb, numeric, numeric, numeric, text, text, text
) to anon, authenticated;
grant execute on function public.mark_incomplete_order_recovered(text, text, uuid)
  to anon, authenticated;

-- ──────────────── ADMIN NOTIFICATIONS ────────────────
create or replace function public.notify_new_order()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  insert into public.admin_notifications (type, reference_id, customer_name, amount, title, message, url)
  values (
    'order', new.id, new.customer_name, coalesce(new.total, 0),
    'New order received',
    coalesce(new.order_number, '') || ' · ' || coalesce(new.customer_name, 'Customer'),
    '/admin/orders'
  );
  return new;
end $$;

create or replace function public.notify_new_incomplete_order()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  insert into public.admin_notifications (type, reference_id, customer_name, amount, title, message, url)
  values (
    'incomplete_order', new.id, new.customer_name, coalesce(new.total, 0),
    'New incomplete order',
    coalesce(new.customer_name, 'Customer') || ' · ' || coalesce(new.phone, ''),
    '/admin/incomplete-orders'
  );
  return new;
end $$;

create or replace function public.mark_admin_notifications_seen(_type text default null)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
  if not public.is_admin_or_staff(auth.uid()) then return; end if;
  update public.admin_notifications
     set admin_seen = true, seen_at = now()
   where admin_seen = false
     and (_type is null or type = _type);
end $$;

grant execute on function public.mark_admin_notifications_seen(text) to authenticated;

-- ──────────────── ADMIN NOTIFICATION CLEANUP ────────────────
-- Deletes seen notifications older than 7 days and any older than 30 days.
-- Scheduled via pg_cron in 04_triggers.sql.
create or replace function public.prune_admin_notifications()
returns integer language plpgsql security definer set search_path to 'public' as $$
declare _deleted integer := 0; _n integer;
begin
  delete from public.admin_notifications
   where admin_seen = true and created_at < now() - interval '7 days';
  get diagnostics _n = row_count; _deleted := _deleted + _n;

  delete from public.admin_notifications
   where created_at < now() - interval '30 days';
  get diagnostics _n = row_count; _deleted := _deleted + _n;

  return _deleted;
end $$;