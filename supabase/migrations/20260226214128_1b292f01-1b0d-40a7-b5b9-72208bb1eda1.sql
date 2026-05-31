
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

-- Security definer function for role checks
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

-- Helper: check if user is admin or staff
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

-- RLS for user_roles
create policy "Admins can manage roles"
on public.user_roles for all
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "Users can read own role"
on public.user_roles for select
to authenticated
using (auth.uid() = user_id);

-- 2. PROFILES TABLE
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
on public.profiles for select
to authenticated
using (public.is_admin_or_staff(auth.uid()));

create policy "Users can view own profile"
on public.profiles for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can update own profile"
on public.profiles for update
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own profile"
on public.profiles for insert
to authenticated
with check (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- 3. CATEGORIES TABLE
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

create policy "Public can read categories"
on public.categories for select to anon, authenticated using (true);

create policy "Admin can manage categories"
on public.categories for all to authenticated
using (public.is_admin_or_staff(auth.uid()))
with check (public.is_admin_or_staff(auth.uid()));

-- Seed default categories
insert into public.categories (name, slug, sort_order) values
('Skincare', 'skincare', 1),
('Makeup', 'makeup', 2),
('Hair Care', 'hair-care', 3),
('Body Care', 'body-care', 4);

-- 4. PRODUCTS TABLE
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
  rating numeric(2,1) not null default 0,
  review_count int not null default 0,
  featured boolean not null default false,
  best_seller boolean not null default false,
  images text[] not null default '{}',
  variants jsonb default '[]',
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

-- 5. PRODUCT FAQS
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

-- 6. PRODUCT DESCRIPTION TABS
create table public.product_tabs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade not null,
  title text not null,
  content text not null,
  sort_order int not null default 0
);

alter table public.product_tabs enable row level security;

create policy "Public can read product tabs"
on public.product_tabs for select to anon, authenticated using (true);

create policy "Admin/staff can manage product tabs"
on public.product_tabs for all to authenticated
using (public.is_admin_or_staff(auth.uid()))
with check (public.is_admin_or_staff(auth.uid()));

-- 7. ORDERS TABLE
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  shipping_address jsonb,
  items jsonb not null default '[]',
  subtotal numeric(10,2) not null default 0,
  shipping_cost numeric(10,2) not null default 0,
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

create policy "Users can view own orders"
on public.orders for select to authenticated
using (auth.uid() = user_id);

-- 8. CUSTOMERS TABLE (derived from orders, but also standalone)
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
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

-- 9. HOMEPAGE SECTIONS (key-value config)
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

-- Seed homepage sections
insert into public.homepage_sections (id, title, enabled, content, sort_order) values
('hero', 'Hero Section', true, '{"headline": "Beauty in its purest form.", "subtext": "Clean, effective skincare crafted with intention.", "image": "", "video": "", "button1_text": "Explore Collection", "button1_link": "/shop", "button1_enabled": true, "button2_text": "Our Story", "button2_link": "/about", "button2_enabled": true}', 1),
('featured', 'Featured Collection', true, '{"section_title": "Featured Collection", "subtitle": "Curated picks, handpicked for you."}', 2),
('bestsellers', 'Best Sellers', true, '{"section_title": "Best Sellers", "subtitle": "Our most loved products."}', 3),
('brand_story', 'Brand Story Preview', true, '{"title": "Our Story", "text": "Born from a belief that beauty should be simple, honest, and effective.", "image": "", "button_text": "Read More", "button_link": "/about"}', 4),
('why_choose_us', 'Why Choose Us', true, '{"cards": []}', 5),
('testimonials', 'Testimonials', true, '{}', 6),
('faq', 'FAQ', true, '{}', 7),
('newsletter', 'Newsletter Signup', true, '{"headline": "Stay in the Loop", "subtext": "Be the first to know about new launches, exclusive offers, and skincare tips.", "email_service": ""}', 8);

-- 10. TESTIMONIALS TABLE
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

create policy "Public can read testimonials"
on public.testimonials for select to anon, authenticated using (true);

create policy "Admin can manage testimonials"
on public.testimonials for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- 11. HOME FAQS
create table public.home_faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.home_faqs enable row level security;

create policy "Public can read home faqs"
on public.home_faqs for select to anon, authenticated using (true);

create policy "Admin can manage home faqs"
on public.home_faqs for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- 12. WHY CHOOSE US CARDS
create table public.why_choose_us_cards (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  icon_name text not null default 'Shield',
  sort_order int not null default 0
);

alter table public.why_choose_us_cards enable row level security;

create policy "Public can read why choose us cards"
on public.why_choose_us_cards for select to anon, authenticated using (true);

create policy "Admin can manage why choose us cards"
on public.why_choose_us_cards for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- 13. SHOP SETTINGS
create table public.shop_settings (
  id text primary key default 'default',
  search_enabled boolean not null default true,
  sorting_enabled boolean not null default true,
  default_sorting text not null default 'newest',
  updated_at timestamptz not null default now()
);

alter table public.shop_settings enable row level security;

create policy "Public can read shop settings"
on public.shop_settings for select to anon, authenticated using (true);

create policy "Admin can manage shop settings"
on public.shop_settings for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

insert into public.shop_settings (id) values ('default');

-- 14. ABOUT PAGE SECTIONS
create table public.about_sections (
  id text primary key,
  title text,
  enabled boolean not null default true,
  content jsonb not null default '{}',
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.about_sections enable row level security;

create policy "Public can read about sections"
on public.about_sections for select to anon, authenticated using (true);

create policy "Admin can manage about sections"
on public.about_sections for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

insert into public.about_sections (id, title, enabled, content, sort_order) values
('header', 'Page Header', true, '{"title": "About Our Brand", "intro": "Our journey, our passion, our promise to you."}', 1),
('story', 'Brand Story', true, '{"headline": "Our Story", "text": "", "image": ""}', 2),
('mission_vision', 'Mission & Vision', true, '{"mission": "", "vision": ""}', 3),
('founder', 'Founder / Inspiration', true, '{"headline": "", "message": "", "image": ""}', 4),
('values', 'Values', true, '{"cards": []}', 5),
('cta', 'Call to Action', true, '{"text": "Discover our collection", "button_text": "Shop Now", "button_link": "/shop"}', 6);

-- 15. CONTACT PAGE SETTINGS
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

create policy "Public can read contact settings"
on public.contact_settings for select to anon, authenticated using (true);

create policy "Admin can manage contact settings"
on public.contact_settings for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

insert into public.contact_settings (id) values ('default');

-- 16. POLICY PAGES
create table public.policies (
  id text primary key,
  title text not null,
  content text not null default '',
  enabled boolean not null default true,
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.policies enable row level security;

create policy "Public can read policies"
on public.policies for select to anon, authenticated using (true);

create policy "Admin can manage policies"
on public.policies for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

insert into public.policies (id, title, enabled, sort_order) values
('privacy', 'Privacy Policy', true, 1),
('refund', 'Refund Policy', true, 2),
('shipping', 'Shipping Policy', true, 3),
('terms', 'Terms & Conditions', true, 4);

-- 17. MEDIA LIBRARY
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

create policy "Admin/staff can manage media"
on public.media for all to authenticated
using (public.is_admin_or_staff(auth.uid()))
with check (public.is_admin_or_staff(auth.uid()));

create policy "Public can read media"
on public.media for select to anon, authenticated using (true);

-- 18. DESIGN SETTINGS
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

create policy "Public can read design settings"
on public.design_settings for select to anon, authenticated using (true);

create policy "Admin can manage design settings"
on public.design_settings for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

insert into public.design_settings (id) values ('default');

-- 19. WHATSAPP SETTINGS
create table public.whatsapp_settings (
  id text primary key default 'default',
  phone_number text not null default '',
  enabled boolean not null default true,
  radar_animation boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.whatsapp_settings enable row level security;

create policy "Public can read whatsapp settings"
on public.whatsapp_settings for select to anon, authenticated using (true);

create policy "Admin can manage whatsapp settings"
on public.whatsapp_settings for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

insert into public.whatsapp_settings (id) values ('default');

-- 20. REVIEWS TABLE
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade not null,
  customer_name text not null,
  rating int not null default 5,
  review text,
  created_at timestamptz not null default now()
);

alter table public.reviews enable row level security;

create policy "Public can read reviews"
on public.reviews for select to anon, authenticated using (true);

create policy "Anyone can create review"
on public.reviews for insert to anon, authenticated with check (true);

create policy "Admin can manage reviews"
on public.reviews for all to authenticated
using (public.is_admin_or_staff(auth.uid()))
with check (public.is_admin_or_staff(auth.uid()));

-- 21. CONTACT SUBMISSIONS
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

create policy "Anyone can submit contact form"
on public.contact_submissions for insert to anon, authenticated with check (true);

create policy "Admin/staff can manage submissions"
on public.contact_submissions for all to authenticated
using (public.is_admin_or_staff(auth.uid()))
with check (public.is_admin_or_staff(auth.uid()));

-- 22. NEWSLETTER SUBSCRIBERS
create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;

create policy "Anyone can subscribe"
on public.newsletter_subscribers for insert to anon, authenticated with check (true);

create policy "Admin can manage subscribers"
on public.newsletter_subscribers for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- STORAGE BUCKET for media
insert into storage.buckets (id, name, public) values ('media', 'media', true);

create policy "Public can view media files"
on storage.objects for select using (bucket_id = 'media');

create policy "Admin/staff can upload media"
on storage.objects for insert to authenticated
with check (bucket_id = 'media' and public.is_admin_or_staff(auth.uid()));

create policy "Admin/staff can update media"
on storage.objects for update to authenticated
using (bucket_id = 'media' and public.is_admin_or_staff(auth.uid()));

create policy "Admin/staff can delete media"
on storage.objects for delete to authenticated
using (bucket_id = 'media' and public.is_admin_or_staff(auth.uid()));

-- Updated_at trigger function
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Add updated_at triggers
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
