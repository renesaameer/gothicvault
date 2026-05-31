
-- =============================================
-- ADMIN PANEL DATABASE SCHEMA
-- =============================================

-- 1. ROLES ENUM & USER ROLES TABLE
create type public.app_role as enum ('admin', 'staff');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

create or replace function public.is_admin_or_staff(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role in ('admin', 'staff')
  )
$$;

create policy "Admins can manage roles"
on public.user_roles for all
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "Users can read own role"
on public.user_roles for select
to authenticated
using (auth.uid() = user_id);

-- 2. PROFILES
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Admin/staff can view all profiles"
on public.profiles for select to authenticated
using (public.is_admin_or_staff(auth.uid()));

create policy "Users can view own profile"
on public.profiles for select to authenticated
using (auth.uid() = user_id);

create policy "Users can update own profile"
on public.profiles for update to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own profile"
on public.profiles for insert to authenticated
with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- 3. CATEGORIES
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sort_order int not null default 0,
  parent_id uuid references public.categories(id) on delete set null,
  image_url text,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

create policy "Public can read categories"
on public.categories for select to anon, authenticated using (true);

create policy "Admin can manage categories"
on public.categories for all to authenticated
using (public.is_admin_or_staff(auth.uid()))
with check (public.is_admin_or_staff(auth.uid()));

insert into public.categories (name, slug, sort_order) values
('Skincare', 'skincare', 1),
('Makeup', 'makeup', 2),
('Hair Care', 'hair-care', 3),
('Body Care', 'body-care', 4);

-- 4. BRANDS
CREATE TABLE public.brands (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,
  description text,
  enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/staff can manage brands" ON public.brands FOR ALL
  USING (is_admin_or_staff(auth.uid())) WITH CHECK (is_admin_or_staff(auth.uid()));
CREATE POLICY "Public can read brands" ON public.brands FOR SELECT USING (true);

-- 5. PRODUCTS
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  short_description text,
  description text,
  how_to_use text,
  ingredients text,
  additional_info text,
  price numeric(10,2) not null default 0,
  sale_price numeric(10,2),
  sku text,
  stock int not null default 0,
  category_id uuid references public.categories(id) on delete set null,
  brand_id uuid references public.brands(id) on delete set null,
  rating numeric(2,1) not null default 0,
  review_count int not null default 0,
  featured boolean not null default false,
  best_seller boolean not null default false,
  images text[] not null default '{}',
  variants jsonb default '[]',
  show_offers boolean not null default true,
  show_shipping_info boolean not null default true,
  show_stock_status boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;

create policy "Public can read products"
on public.products for select to anon, authenticated using (true);

create policy "Admin/staff can manage products"
on public.products for all to authenticated
using (public.is_admin_or_staff(auth.uid()))
with check (public.is_admin_or_staff(auth.uid()));

-- 6. PRODUCT FAQS
create table public.product_faqs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade not null,
  question text not null,
  answer text not null,
  sort_order int not null default 0
);

alter table public.product_faqs enable row level security;

create policy "Public can read product faqs"
on public.product_faqs for select to anon, authenticated using (true);

create policy "Admin/staff can manage product faqs"
on public.product_faqs for all to authenticated
using (public.is_admin_or_staff(auth.uid()))
with check (public.is_admin_or_staff(auth.uid()));

-- 7. PRODUCT TABS
create table public.product_tabs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade not null,
  title text not null,
  content text not null,
  display_style text not null default 'text',
  sort_order int not null default 0
);

alter table public.product_tabs enable row level security;

create policy "Public can read product tabs"
on public.product_tabs for select to anon, authenticated using (true);

create policy "Admin/staff can manage product tabs"
on public.product_tabs for all to authenticated
using (public.is_admin_or_staff(auth.uid()))
with check (public.is_admin_or_staff(auth.uid()));

-- 8. ORDERS
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_name text not null,
  customer_email text,
  customer_phone text,
  shipping_address jsonb,
  items jsonb not null default '[]',
  subtotal numeric(10,2) not null default 0,
  shipping_cost numeric(10,2) not null default 0,
  discount_amount numeric not null default 0,
  coupon_code text,
  total numeric(10,2) not null default 0,
  payment_status text not null default 'pending',
  order_status text not null default 'pending',
  tracking_number text,
  notes text,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders enable row level security;

create policy "Admin/staff can manage orders"
on public.orders for all to authenticated
using (public.is_admin_or_staff(auth.uid()))
with check (public.is_admin_or_staff(auth.uid()));

create policy "Anyone can create orders" on public.orders for insert with check (true);
create policy "Anyone can track orders by number" on public.orders for select using (true);

-- 9. CUSTOMERS
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  phone text,
  total_spent numeric(10,2) not null default 0,
  order_count int not null default 0,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.customers enable row level security;

create policy "Admin/staff can manage customers"
on public.customers for all to authenticated
using (public.is_admin_or_staff(auth.uid()))
with check (public.is_admin_or_staff(auth.uid()));

-- 10. HOMEPAGE SECTIONS
create table public.homepage_sections (
  id text primary key,
  title text,
  enabled boolean not null default true,
  content jsonb not null default '{}',
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.homepage_sections enable row level security;

create policy "Public can read homepage sections"
on public.homepage_sections for select to anon, authenticated using (true);

create policy "Admin can manage homepage sections"
on public.homepage_sections for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

insert into public.homepage_sections (id, title, enabled, content, sort_order) values
('hero', 'Hero Section', true, '{"headline":"Beauty in its purest form.","subtext":"Clean, effective skincare crafted with intention.","image":"","video":"","button1_text":"Explore Collection","button1_link":"/shop","button1_enabled":true,"button2_text":"Our Story","button2_link":"/about","button2_enabled":true}', 1),
('featured', 'Featured Collection', true, '{"section_title":"Featured Collection","subtitle":"Curated picks, handpicked for you."}', 2),
('bestsellers', 'Best Sellers', true, '{"section_title":"Best Sellers","subtitle":"Our most loved products."}', 3),
('brand_story', 'Brand Story Preview', true, '{"title":"Our Story","text":"Born from a belief that beauty should be simple, honest, and effective.","image":"","button_text":"Read More","button_link":"/about"}', 4),
('why_choose_us', 'Why Choose Us', true, '{"cards":[]}', 5),
('testimonials', 'Testimonials', true, '{}', 6),
('faq', 'FAQ', true, '{}', 7),
('newsletter', 'Newsletter Signup', true, '{"headline":"Stay in the Loop","subtext":"Be the first to know.","email_service":""}', 8);

-- 11. HERO SLIDES
create table public.hero_slides (
  id uuid primary key default gen_random_uuid(),
  title text,
  subtitle text,
  image_url text,
  button_text text,
  button_link text,
  enabled boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.hero_slides enable row level security;
create policy "Public can read hero slides" on public.hero_slides for select using (true);
create policy "Admin can manage hero slides" on public.hero_slides for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- 12. TESTIMONIALS
create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  review text not null,
  rating int not null default 5,
  image_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.testimonials enable row level security;
create policy "Public can read testimonials" on public.testimonials for select using (true);
create policy "Admin can manage testimonials" on public.testimonials for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- 13. HOME FAQS
create table public.home_faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.home_faqs enable row level security;
create policy "Public can read home faqs" on public.home_faqs for select using (true);
create policy "Admin can manage home faqs" on public.home_faqs for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- 14. WHY CHOOSE US
create table public.why_choose_us_cards (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  icon_name text not null default 'Shield',
  sort_order int not null default 0
);
alter table public.why_choose_us_cards enable row level security;
create policy "Public can read why choose us cards" on public.why_choose_us_cards for select using (true);
create policy "Admin can manage why choose us cards" on public.why_choose_us_cards for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- 15. SHOP SETTINGS
create table public.shop_settings (
  id text primary key default 'default',
  search_enabled boolean not null default true,
  sorting_enabled boolean not null default true,
  default_sorting text not null default 'newest',
  card_cta_mode text not null default 'add_to_cart',
  updated_at timestamptz not null default now()
);
alter table public.shop_settings enable row level security;
create policy "Public can read shop settings" on public.shop_settings for select using (true);
create policy "Admin can manage shop settings" on public.shop_settings for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
insert into public.shop_settings (id) values ('default');

-- 16. ABOUT SECTIONS
create table public.about_sections (
  id text primary key,
  title text,
  enabled boolean not null default true,
  content jsonb not null default '{}',
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.about_sections enable row level security;
create policy "Public can read about sections" on public.about_sections for select using (true);
create policy "Admin can manage about sections" on public.about_sections for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

insert into public.about_sections (id, title, enabled, content, sort_order) values
('header', 'Page Header', true, '{"title":"About Our Brand","intro":"Our journey, our passion, our promise to you."}', 1),
('story', 'Brand Story', true, '{"headline":"Our Story","text":"","image":""}', 2),
('mission_vision', 'Mission & Vision', true, '{"mission":"","vision":""}', 3),
('founder', 'Founder', true, '{"headline":"","message":"","image":""}', 4),
('values', 'Values', true, '{"cards":[]}', 5),
('cta', 'Call to Action', true, '{"text":"Discover our collection","button_text":"Shop Now","button_link":"/shop"}', 6);

-- 17. CONTACT SETTINGS
create table public.contact_settings (
  id text primary key default 'default',
  page_title text not null default 'Get in Touch',
  page_intro text not null default 'We would love to hear from you.',
  receiving_email text not null default '',
  phone_field_enabled boolean not null default true,
  submit_button_text text not null default 'Send Message',
  email_address text not null default '',
  phone_number text not null default '',
  business_address text,
  show_address boolean not null default false,
  social_links jsonb not null default '[]',
  social_section_enabled boolean not null default true,
  map_embed text,
  map_enabled boolean not null default false,
  faq_shortcut_enabled boolean not null default false,
  faq_shortcut_items jsonb not null default '[]',
  updated_at timestamptz not null default now()
);
alter table public.contact_settings enable row level security;
create policy "Public can read contact settings" on public.contact_settings for select using (true);
create policy "Admin can manage contact settings" on public.contact_settings for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
insert into public.contact_settings (id) values ('default');

-- 18. POLICIES
create table public.policies (
  id text primary key,
  title text not null,
  content text not null default '',
  enabled boolean not null default true,
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.policies enable row level security;
create policy "Public can read policies" on public.policies for select using (true);
create policy "Admin can manage policies" on public.policies for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

insert into public.policies (id, title, enabled, sort_order) values
('privacy', 'Privacy Policy', true, 1),
('refund', 'Refund Policy', true, 2),
('shipping', 'Shipping Policy', true, 3),
('terms', 'Terms & Conditions', true, 4);

-- 19. MEDIA
create table public.media (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  file_url text not null,
  file_size int,
  mime_type text,
  alt_text text,
  created_at timestamptz not null default now()
);
alter table public.media enable row level security;
create policy "Admin/staff can manage media" on public.media for all to authenticated
  using (public.is_admin_or_staff(auth.uid())) with check (public.is_admin_or_staff(auth.uid()));
create policy "Public can read media" on public.media for select using (true);

-- 20. DESIGN SETTINGS
create table public.design_settings (
  id text primary key default 'default',
  logo_desktop_url text,
  logo_mobile_url text,
  logo_footer_url text,
  favicon_url text,
  primary_color text not null default '#000000',
  secondary_color text not null default '#f5f5f5',
  button_style text not null default 'solid',
  updated_at timestamptz not null default now()
);
alter table public.design_settings enable row level security;
create policy "Public can read design settings" on public.design_settings for select using (true);
create policy "Admin can manage design settings" on public.design_settings for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
insert into public.design_settings (id) values ('default');

-- 21. WHATSAPP SETTINGS (kept for backwards compatibility; new floating_icons table comes in part 3)
create table public.whatsapp_settings (
  id text primary key default 'default',
  phone_number text not null default '',
  enabled boolean not null default true,
  radar_animation boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.whatsapp_settings enable row level security;
create policy "Public can read whatsapp settings" on public.whatsapp_settings for select using (true);
create policy "Admin can manage whatsapp settings" on public.whatsapp_settings for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
insert into public.whatsapp_settings (id) values ('default');

-- 22. REVIEWS
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade not null,
  customer_name text not null,
  rating int not null default 5,
  review text,
  created_at timestamptz not null default now()
);
alter table public.reviews enable row level security;
create policy "Public can read reviews" on public.reviews for select using (true);
create policy "Anyone can create review" on public.reviews for insert with check (true);
create policy "Admin can manage reviews" on public.reviews for all to authenticated
  using (public.is_admin_or_staff(auth.uid())) with check (public.is_admin_or_staff(auth.uid()));

-- 23. CONTACT SUBMISSIONS
create table public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.contact_submissions enable row level security;
create policy "Anyone can submit contact form" on public.contact_submissions for insert with check (true);
create policy "Admin/staff can manage submissions" on public.contact_submissions for all to authenticated
  using (public.is_admin_or_staff(auth.uid())) with check (public.is_admin_or_staff(auth.uid()));

-- 24. NEWSLETTER SUBSCRIBERS
create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);
alter table public.newsletter_subscribers enable row level security;
create policy "Anyone can subscribe" on public.newsletter_subscribers for insert with check (true);
create policy "Admin can manage subscribers" on public.newsletter_subscribers for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.subscribe_newsletter(_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO newsletter_subscribers (email) VALUES (_email)
  ON CONFLICT (email) DO NOTHING;
END;
$$;

-- 25. STORAGE BUCKET
insert into storage.buckets (id, name, public) values ('media', 'media', true);

create policy "Public can view media files" on storage.objects for select using (bucket_id = 'media');
create policy "Admin/staff can upload media" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_admin_or_staff(auth.uid()));
create policy "Admin/staff can update media" on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.is_admin_or_staff(auth.uid()));
create policy "Admin/staff can delete media" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_admin_or_staff(auth.uid()));

-- 26. UPDATED_AT TRIGGER FN
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger update_products_updated_at before update on public.products for each row execute function public.update_updated_at_column();
create trigger update_orders_updated_at before update on public.orders for each row execute function public.update_updated_at_column();
create trigger update_customers_updated_at before update on public.customers for each row execute function public.update_updated_at_column();
create trigger update_profiles_updated_at before update on public.profiles for each row execute function public.update_updated_at_column();
create trigger update_homepage_sections_updated_at before update on public.homepage_sections for each row execute function public.update_updated_at_column();
create trigger update_about_sections_updated_at before update on public.about_sections for each row execute function public.update_updated_at_column();
create trigger update_contact_settings_updated_at before update on public.contact_settings for each row execute function public.update_updated_at_column();
create trigger update_policies_updated_at before update on public.policies for each row execute function public.update_updated_at_column();
create trigger update_design_settings_updated_at before update on public.design_settings for each row execute function public.update_updated_at_column();
create trigger update_whatsapp_settings_updated_at before update on public.whatsapp_settings for each row execute function public.update_updated_at_column();
create trigger update_shop_settings_updated_at before update on public.shop_settings for each row execute function public.update_updated_at_column();

-- 27. DELIVERY ZONES
CREATE TABLE public.delivery_zones (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_name text NOT NULL,
  areas text NOT NULL DEFAULT '',
  delivery_charge numeric NOT NULL DEFAULT 0,
  free_delivery_minimum numeric DEFAULT NULL,
  estimated_days text DEFAULT '3-5 days',
  enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage delivery zones" ON public.delivery_zones FOR ALL
  USING (is_admin_or_staff(auth.uid())) WITH CHECK (is_admin_or_staff(auth.uid()));
CREATE POLICY "Public can read delivery zones" ON public.delivery_zones FOR SELECT USING (true);

INSERT INTO public.delivery_zones (zone_name, areas, delivery_charge, free_delivery_minimum, estimated_days, sort_order) VALUES
('Inside Dhaka', 'Dhaka City, Mirpur, Uttara, Gulshan, Banani, Dhanmondi, Mohammadpur', 60, 1500, '1-2 days', 0),
('Outside Dhaka', 'All districts outside Dhaka', 120, 2000, '3-5 days', 1);

-- 28. PRODUCT OFFERS
CREATE TABLE public.product_offers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  offer_type text NOT NULL,
  buy_quantity integer DEFAULT NULL,
  get_quantity integer DEFAULT NULL,
  discount_value numeric DEFAULT NULL,
  free_product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  min_cart_total numeric DEFAULT NULL,
  display_text text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.product_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage product offers" ON public.product_offers FOR ALL
  USING (is_admin_or_staff(auth.uid())) WITH CHECK (is_admin_or_staff(auth.uid()));
CREATE POLICY "Public can read product offers" ON public.product_offers FOR SELECT USING (true);

-- 29. COUPONS
CREATE TABLE public.coupons (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL DEFAULT 'percentage',
  discount_value numeric NOT NULL DEFAULT 0,
  min_order_amount numeric DEFAULT 0,
  max_uses integer DEFAULT NULL,
  used_count integer NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  expires_at timestamp with time zone DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage coupons" ON public.coupons FOR ALL
  USING (is_admin_or_staff(auth.uid())) WITH CHECK (is_admin_or_staff(auth.uid()));
CREATE POLICY "Public can read enabled coupons" ON public.coupons FOR SELECT USING (enabled = true);

-- RPC functions
CREATE OR REPLACE FUNCTION public.increment_coupon_usage(_code text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN UPDATE coupons SET used_count = used_count + 1 WHERE code = _code; END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_checkout_customer(
  _name text, _email text, _phone text, _order_total numeric
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO customers (name, email, phone, order_count, total_spent)
  VALUES (_name, COALESCE(_email, _phone || '@noemail.local'), _phone, 1, _order_total)
  ON CONFLICT (email) DO UPDATE SET
    order_count = customers.order_count + 1,
    total_spent = customers.total_spent + _order_total,
    name = _name,
    phone = COALESCE(_phone, customers.phone),
    updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_product_stock(_product_id uuid, _quantity int)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN UPDATE products SET stock = GREATEST(0, stock - _quantity) WHERE id = _product_id; END;
$$;
