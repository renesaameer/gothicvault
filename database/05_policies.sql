-- ============================================================================
-- 05 — Row Level Security: enable + policies
-- ============================================================================

-- Enable RLS on every public table
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname='public' loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- ──────────────── profiles ────────────────
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update to authenticated using (auth.uid() = user_id);
drop policy if exists "Admin/staff can view all profiles" on public.profiles;
create policy "Admin/staff can view all profiles" on public.profiles for select to authenticated using (public.is_admin_or_staff(auth.uid()));

-- ──────────────── user_roles ────────────────
drop policy if exists "Users can read own role" on public.user_roles;
create policy "Users can read own role" on public.user_roles for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Admins can manage roles" on public.user_roles;
create policy "Admins can manage roles" on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
drop policy if exists "First user can claim admin" on public.user_roles;
create policy "First user can claim admin" on public.user_roles for insert to authenticated
  with check (auth.uid() = user_id and role = 'admin'::public.app_role
              and not exists (select 1 from public.user_roles where role = 'admin'::public.app_role));

-- ──────────────── Public-read + admin-manage tables (bulk) ────────────────
do $$
declare t text;
declare public_read_admin_manage text[] := array[
  'about_sections','announcement_bar','categories','contact_settings','delivery_partners',
  'delivery_zones','design_settings','direct_order_channels','featured_categories',
  'floating_icons','floating_icons_settings','footer_settings','home_faqs','homepage_sections',
  'invoice_settings','offers','policies','product_faqs','product_tabs','shop_settings',
  'testimonials','tracking_pixels','whatsapp_settings','why_choose_us_cards'
];
begin
  foreach t in array public_read_admin_manage loop
    execute format('drop policy if exists "pub_view" on public.%I', t);
    execute format('create policy "pub_view" on public.%I for select to public using (true)', t);
    execute format('drop policy if exists "admins_manage" on public.%I', t);
    execute format('create policy "admins_manage" on public.%I for all to authenticated using (public.is_admin_or_staff(auth.uid())) with check (public.is_admin_or_staff(auth.uid()))', t);
  end loop;
end $$;

-- ──────────────── Enabled-only public reads ────────────────
drop policy if exists "pub_view" on public.brands;
create policy "pub_view" on public.brands for select to public using (enabled = true);
drop policy if exists "admins_manage" on public.brands;
create policy "admins_manage" on public.brands for all to authenticated using (public.is_admin_or_staff(auth.uid())) with check (public.is_admin_or_staff(auth.uid()));

drop policy if exists "pub_view" on public.hero_slides;
create policy "pub_view" on public.hero_slides for select to public using (enabled = true);
drop policy if exists "admins_manage" on public.hero_slides;
create policy "admins_manage" on public.hero_slides for all to authenticated using (public.is_admin_or_staff(auth.uid())) with check (public.is_admin_or_staff(auth.uid()));

drop policy if exists "pub_view" on public.coupons;
create policy "pub_view" on public.coupons for select to public using (enabled = true);
drop policy if exists "admins_manage" on public.coupons;
create policy "admins_manage" on public.coupons for all to authenticated using (public.is_admin_or_staff(auth.uid())) with check (public.is_admin_or_staff(auth.uid()));

drop policy if exists "pub_view" on public.product_offers;
create policy "pub_view" on public.product_offers for select to public using (enabled = true);
drop policy if exists "admins_manage" on public.product_offers;
create policy "admins_manage" on public.product_offers for all to authenticated using (public.is_admin_or_staff(auth.uid())) with check (public.is_admin_or_staff(auth.uid()));

drop policy if exists "pub_view" on public.product_variants;
create policy "pub_view" on public.product_variants for select to public using (active = true);
drop policy if exists "admins_manage" on public.product_variants;
create policy "admins_manage" on public.product_variants for all to authenticated using (public.is_admin_or_staff(auth.uid())) with check (public.is_admin_or_staff(auth.uid()));

-- ──────────────── products ────────────────
drop policy if exists "pub_view" on public.products;
create policy "pub_view" on public.products for select to public using (true);
drop policy if exists "admins_manage" on public.products;
create policy "admins_manage" on public.products for all to authenticated using (public.is_admin_or_staff(auth.uid())) with check (public.is_admin_or_staff(auth.uid()));

-- ──────────────── reviews ────────────────
drop policy if exists "pub_view" on public.reviews;
create policy "pub_view" on public.reviews for select to public using (true);
drop policy if exists "pub_insert" on public.reviews;
create policy "pub_insert" on public.reviews for insert to public with check (true);
drop policy if exists "admins_manage" on public.reviews;
create policy "admins_manage" on public.reviews for all to authenticated using (public.is_admin_or_staff(auth.uid())) with check (public.is_admin_or_staff(auth.uid()));

-- ──────────────── orders ────────────────
drop policy if exists "pub_create" on public.orders;
create policy "pub_create" on public.orders for insert to public with check (true);
drop policy if exists "staff_view" on public.orders;
create policy "staff_view" on public.orders for select to authenticated using (public.is_admin_or_staff(auth.uid()));
drop policy if exists "staff_update" on public.orders;
create policy "staff_update" on public.orders for update to authenticated using (public.is_admin_or_staff(auth.uid()));
drop policy if exists "staff_delete" on public.orders;
create policy "staff_delete" on public.orders for delete to authenticated using (public.is_admin_or_staff(auth.uid()));

-- ──────────────── customers (admin only) ────────────────
drop policy if exists "admins_manage" on public.customers;
create policy "admins_manage" on public.customers for all to authenticated using (public.is_admin_or_staff(auth.uid())) with check (public.is_admin_or_staff(auth.uid()));

-- ──────────────── contact_submissions ────────────────
drop policy if exists "pub_submit" on public.contact_submissions;
create policy "pub_submit" on public.contact_submissions for insert to public with check (true);
drop policy if exists "admins_manage" on public.contact_submissions;
create policy "admins_manage" on public.contact_submissions for all to authenticated using (public.is_admin_or_staff(auth.uid())) with check (public.is_admin_or_staff(auth.uid()));

-- ──────────────── newsletter_subscribers (admin only — public inserts via RPC) ────────────────
drop policy if exists "admins_manage" on public.newsletter_subscribers;
create policy "admins_manage" on public.newsletter_subscribers for all to authenticated using (public.is_admin_or_staff(auth.uid())) with check (public.is_admin_or_staff(auth.uid()));

-- ──────────────── incomplete_orders (admin only — public writes via RPC) ────────────────
drop policy if exists "admins_manage" on public.incomplete_orders;
create policy "admins_manage" on public.incomplete_orders for all to authenticated
  using (public.is_admin_or_staff(auth.uid())) with check (public.is_admin_or_staff(auth.uid()));

-- ──────────────── admin_notifications (admin/staff only) ────────────────
drop policy if exists "admins_select_notifications" on public.admin_notifications;
create policy "admins_select_notifications" on public.admin_notifications
  for select to authenticated using (public.is_admin_or_staff(auth.uid()));
drop policy if exists "admins_update_notifications" on public.admin_notifications;
create policy "admins_update_notifications" on public.admin_notifications
  for update to authenticated using (public.is_admin_or_staff(auth.uid())) with check (public.is_admin_or_staff(auth.uid()));
drop policy if exists "admins_delete_notifications" on public.admin_notifications;
create policy "admins_delete_notifications" on public.admin_notifications
  for delete to authenticated using (public.is_admin_or_staff(auth.uid()));