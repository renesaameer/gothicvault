-- ============================================================================
-- 02 — Schema: tables + indexes
-- Grouped: auth/identity, catalog, commerce, content, settings
-- All statements idempotent (create … if not exists).
-- ============================================================================

-- ──────────────── AUTH / IDENTITY ────────────────
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

-- ──────────────── CATALOG ────────────────
create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  logo_url text,
  enabled boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  image_url text,
  parent_id uuid,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  short_description text,
  description text,
  sku text,
  category_id uuid,
  brand_id uuid,
  price numeric not null default 0,
  sale_price numeric,
  stock integer not null default 0,
  rating numeric not null default 0,
  review_count integer not null default 0,
  featured boolean not null default false,
  best_seller boolean not null default false,
  images text[] not null default '{}',
  variants jsonb not null default '[]',
  option_groups jsonb not null default '[]',
  show_offers boolean not null default true,
  show_shipping_info boolean not null default true,
  show_stock_status boolean not null default true,
  show_shipping_text boolean not null default true,
  shipping_text text,
  stock_status_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_products_sort_order on public.products(sort_order);
create index if not exists idx_products_category   on public.products(category_id);
create index if not exists idx_products_brand      on public.products(brand_id);

create table if not exists public.product_tabs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null,
  title text not null,
  content text,
  display_style text not null default 'text',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_product_tabs_product on public.product_tabs(product_id);

create table if not exists public.product_faqs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null,
  question text not null,
  answer text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_product_faqs_product on public.product_faqs(product_id);

create table if not exists public.product_offers (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null,
  offer_type text not null,
  display_text text not null default '',
  buy_quantity integer,
  get_quantity integer,
  free_product_id uuid,
  min_cart_total numeric,
  discount_value numeric,
  enabled boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_product_offers_product on public.product_offers(product_id);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null,
  option_values jsonb not null default '{}',
  price numeric not null default 0,
  sale_price numeric,
  stock integer not null default 0,
  sku text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_product_variants_product on public.product_variants(product_id);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null,
  customer_name text not null,
  rating integer not null default 5,
  comment text,
  review text,
  created_at timestamptz not null default now()
);

-- ──────────────── COMMERCE ────────────────
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_name text not null default '',
  customer_email text,
  customer_phone text not null default '',
  customer_address text not null default '',
  customer_city text,
  shipping_address jsonb not null default '{}',
  items jsonb not null default '[]',
  subtotal numeric not null default 0,
  shipping_cost numeric not null default 0,
  discount_amount numeric not null default 0,
  coupon_code text,
  total numeric not null default 0,
  payment_method text default 'cod',
  payment_status text not null default 'pending',
  order_status text not null default 'pending',
  tracking_number text,
  delivery_partner text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_orders_created on public.orders(created_at desc);
create index if not exists idx_orders_phone   on public.orders(customer_phone);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  email text,
  phone text,
  address text,
  city text,
  notes text,
  total_orders integer not null default 0,
  total_spent numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null default 'percentage',
  discount_value numeric not null default 0,
  min_cart_total numeric default 0,
  min_order_amount numeric default 0,
  max_uses integer,
  used_count integer not null default 0,
  enabled boolean not null default true,
  start_date timestamptz,
  end_date timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  discount_type text not null default 'percentage',
  discount_value numeric not null default 0,
  apply_to text not null default 'entire_store',
  target_ids text[],
  banner_image text,
  enabled boolean not null default true,
  start_date timestamptz,
  end_date timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  zone_name text,
  areas jsonb not null default '[]',
  delivery_charge numeric not null default 0,
  shipping_cost numeric not null default 0,
  free_delivery_minimum numeric,
  free_shipping_threshold numeric,
  estimated_days text,
  enabled boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.delivery_partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  config jsonb not null default '{}',
  enabled boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.direct_order_channels (
  id uuid primary key default gen_random_uuid(),
  label text not null default '',
  identifier text not null default '',
  message_template text not null default '',
  enabled boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ──────────────── COMMUNICATIONS ────────────────
create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  message text not null,
  status text not null default 'new',
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  subscribed_at timestamptz not null default now()
);

-- ──────────────── CONTENT ────────────────
create table if not exists public.policies (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null default '',
  content text not null default '',
  enabled boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  review text not null default '',
  rating integer not null default 5,
  image_url text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.home_faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.hero_slides (
  id uuid primary key default gen_random_uuid(),
  image_url text not null default '',
  title text,
  subtitle text,
  button_text text,
  button_link text,
  enabled boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.why_choose_us_cards (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  icon_name text not null default 'Shield',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.featured_categories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid,
  title text,
  image_url text,
  enabled boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.floating_icons (
  id uuid primary key default gen_random_uuid(),
  label text not null default '',
  url text not null default '',
  icon_url text,
  bg_color text not null default '#000000',
  icon_color text default '#ffffff',
  preset_key text,
  enabled boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.tracking_pixels (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  pixel_id text not null default '',
  access_token text,
  test_event_code text,
  advanced_matching boolean not null default true,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

-- ──────────────── SETTINGS (singletons keyed by text id='default') ────────────────
create table if not exists public.shop_settings (
  id text primary key,
  default_sorting text not null default 'newest',
  sorting_enabled boolean not null default true,
  search_enabled boolean not null default true,
  card_cta_mode text not null default 'view_details',
  card_show_add_to_cart boolean not null default true,
  card_show_view_details boolean not null default true,
  card_show_buy_now boolean not null default true,
  pdp_show_why_choose_us boolean not null default true,
  pdp_show_shipment_details boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.footer_settings (
  id text primary key,
  store_name text not null default '',
  description text not null default '',
  email text not null default '',
  phone text not null default '',
  address text not null default '',
  copyright_text text not null default '© {year}',
  social_links jsonb not null default '[]',
  quick_links jsonb not null default '[]',
  customer_care_links jsonb not null default '[]',
  newsletter_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.contact_settings (
  id text primary key,
  page_title text,
  page_intro text,
  phone_number text,
  email_address text,
  receiving_email text,
  show_address boolean not null default true,
  business_address text,
  phone_field_enabled boolean not null default true,
  submit_button_text text default 'Send Message',
  social_section_enabled boolean not null default false,
  social_links jsonb not null default '[]',
  faq_shortcut_enabled boolean not null default false,
  faq_shortcut_items jsonb not null default '[]',
  map_enabled boolean not null default false,
  map_embed text,
  updated_at timestamptz not null default now()
);

create table if not exists public.design_settings (
  id text primary key,
  logo_desktop_url text,
  logo_mobile_url text,
  logo_footer_url text,
  favicon_url text,
  updated_at timestamptz not null default now()
);

create table if not exists public.invoice_settings (
  id text primary key,
  store_name text,
  store_address text,
  store_phone text,
  store_email text,
  logo_url text,
  footer_note text,
  footer_text text,
  signature_label text,
  terms_text text,
  updated_at timestamptz not null default now()
);

create table if not exists public.whatsapp_settings (
  id text primary key,
  phone_number text not null default '',
  enabled boolean not null default false,
  radar_animation boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.floating_icons_settings (
  id text primary key,
  enabled boolean not null default true,
  animation_style text default 'pulse',
  animation_intensity text default 'medium',
  radar_animation boolean not null default true,
  expand_icon_url text,
  updated_at timestamptz not null default now()
);

create table if not exists public.announcement_bar (
  id text primary key,
  text text not null default '',
  link text not null default '',
  bg_color text not null default '#000000',
  text_color text not null default '#ffffff',
  enabled boolean not null default false,
  dismissible boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.about_sections (
  id text primary key,
  content jsonb not null default '{}',
  enabled boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.homepage_sections (
  id text primary key,
  content jsonb not null default '{}',
  enabled boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

-- ──────────────── INCOMPLETE ORDERS (cart abandonment recovery) ────────────────
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
create index if not exists idx_incomplete_orders_phone         on public.incomplete_orders(phone);
create index if not exists idx_incomplete_orders_session       on public.incomplete_orders(session_id);
create index if not exists idx_incomplete_orders_last_activity on public.incomplete_orders(last_activity desc);
create index if not exists idx_incomplete_orders_status        on public.incomplete_orders(recovery_status);
create index if not exists idx_incomplete_orders_recovered     on public.incomplete_orders(recovered);

-- ──────────────── ADMIN NOTIFICATIONS (realtime inbox for staff) ────────────────
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
create index if not exists idx_admin_notifications_unseen  on public.admin_notifications(type, created_at desc) where admin_seen = false;
create index if not exists idx_admin_notifications_created on public.admin_notifications(created_at desc);