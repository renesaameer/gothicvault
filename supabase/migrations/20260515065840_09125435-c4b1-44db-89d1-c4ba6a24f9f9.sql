-- Announcement bar
CREATE TABLE IF NOT EXISTS public.announcement_bar (
  id text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT false,
  text text NOT NULL DEFAULT '',
  link text NOT NULL DEFAULT '',
  bg_color text NOT NULL DEFAULT '#000000',
  text_color text NOT NULL DEFAULT '#ffffff',
  dismissible boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.announcement_bar ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN EXECUTE 'CREATE POLICY "Public view announcement" ON public.announcement_bar FOR SELECT USING (true)'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN EXECUTE 'CREATE POLICY "Admins manage announcement" ON public.announcement_bar FOR ALL TO authenticated USING (is_admin_or_staff(auth.uid())) WITH CHECK (is_admin_or_staff(auth.uid()))'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.hero_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sort_order integer NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  image_url text NOT NULL DEFAULT '',
  title text, subtitle text, button_text text, button_link text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN EXECUTE 'CREATE POLICY "Public view enabled slides" ON public.hero_slides FOR SELECT USING (enabled = true)'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN EXECUTE 'CREATE POLICY "Admins manage slides" ON public.hero_slides FOR ALL TO authenticated USING (is_admin_or_staff(auth.uid())) WITH CHECK (is_admin_or_staff(auth.uid()))'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.home_faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL, answer text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.home_faqs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN EXECUTE 'CREATE POLICY "Public view home faqs" ON public.home_faqs FOR SELECT USING (true)'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN EXECUTE 'CREATE POLICY "Admins manage home faqs" ON public.home_faqs FOR ALL TO authenticated USING (is_admin_or_staff(auth.uid())) WITH CHECK (is_admin_or_staff(auth.uid()))'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  review text NOT NULL DEFAULT '',
  rating integer NOT NULL DEFAULT 5,
  image_url text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN EXECUTE 'CREATE POLICY "Public view testimonials" ON public.testimonials FOR SELECT USING (true)'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN EXECUTE 'CREATE POLICY "Admins manage testimonials" ON public.testimonials FOR ALL TO authenticated USING (is_admin_or_staff(auth.uid())) WITH CHECK (is_admin_or_staff(auth.uid()))'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.why_choose_us_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  icon_name text NOT NULL DEFAULT 'Shield',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.why_choose_us_cards ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN EXECUTE 'CREATE POLICY "Public view why cards" ON public.why_choose_us_cards FOR SELECT USING (true)'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN EXECUTE 'CREATE POLICY "Admins manage why cards" ON public.why_choose_us_cards FOR ALL TO authenticated USING (is_admin_or_staff(auth.uid())) WITH CHECK (is_admin_or_staff(auth.uid()))'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Settings singletons
CREATE TABLE IF NOT EXISTS public.design_settings (
  id text PRIMARY KEY,
  logo_desktop_url text, logo_mobile_url text, logo_footer_url text, favicon_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.design_settings ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN EXECUTE 'CREATE POLICY "Public view design" ON public.design_settings FOR SELECT USING (true)'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN EXECUTE 'CREATE POLICY "Admins manage design" ON public.design_settings FOR ALL TO authenticated USING (is_admin_or_staff(auth.uid())) WITH CHECK (is_admin_or_staff(auth.uid()))'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.whatsapp_settings (
  id text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT false,
  phone_number text NOT NULL DEFAULT '',
  radar_animation boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.whatsapp_settings ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN EXECUTE 'CREATE POLICY "Public view whatsapp" ON public.whatsapp_settings FOR SELECT USING (true)'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN EXECUTE 'CREATE POLICY "Admins manage whatsapp" ON public.whatsapp_settings FOR ALL TO authenticated USING (is_admin_or_staff(auth.uid())) WITH CHECK (is_admin_or_staff(auth.uid()))'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.footer_settings (
  id text PRIMARY KEY,
  store_name text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  copyright_text text NOT NULL DEFAULT '© {year}',
  social_links jsonb NOT NULL DEFAULT '[]'::jsonb,
  quick_links jsonb NOT NULL DEFAULT '[]'::jsonb,
  customer_care_links jsonb NOT NULL DEFAULT '[]'::jsonb,
  newsletter_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.footer_settings ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN EXECUTE 'CREATE POLICY "Public view footer" ON public.footer_settings FOR SELECT USING (true)'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN EXECUTE 'CREATE POLICY "Admins manage footer" ON public.footer_settings FOR ALL TO authenticated USING (is_admin_or_staff(auth.uid())) WITH CHECK (is_admin_or_staff(auth.uid()))'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.shop_settings (
  id text PRIMARY KEY,
  search_enabled boolean NOT NULL DEFAULT true,
  sorting_enabled boolean NOT NULL DEFAULT true,
  default_sorting text NOT NULL DEFAULT 'newest',
  card_cta_mode text NOT NULL DEFAULT 'view_details',
  card_show_view_details boolean NOT NULL DEFAULT true,
  card_show_add_to_cart boolean NOT NULL DEFAULT true,
  card_show_buy_now boolean NOT NULL DEFAULT true,
  pdp_show_shipment_details boolean NOT NULL DEFAULT true,
  pdp_show_why_choose_us boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN EXECUTE 'CREATE POLICY "Public view shop settings" ON public.shop_settings FOR SELECT USING (true)'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN EXECUTE 'CREATE POLICY "Admins manage shop settings" ON public.shop_settings FOR ALL TO authenticated USING (is_admin_or_staff(auth.uid())) WITH CHECK (is_admin_or_staff(auth.uid()))'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.contact_settings (
  id text PRIMARY KEY,
  page_title text, page_intro text,
  phone_number text, email_address text, receiving_email text,
  show_address boolean NOT NULL DEFAULT true,
  business_address text,
  phone_field_enabled boolean NOT NULL DEFAULT true,
  submit_button_text text DEFAULT 'Send Message',
  social_section_enabled boolean NOT NULL DEFAULT false,
  social_links jsonb NOT NULL DEFAULT '[]'::jsonb,
  faq_shortcut_enabled boolean NOT NULL DEFAULT false,
  faq_shortcut_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  map_enabled boolean NOT NULL DEFAULT false,
  map_embed text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.contact_settings ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN EXECUTE 'CREATE POLICY "Public view contact" ON public.contact_settings FOR SELECT USING (true)'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN EXECUTE 'CREATE POLICY "Admins manage contact" ON public.contact_settings FOR ALL TO authenticated USING (is_admin_or_staff(auth.uid())) WITH CHECK (is_admin_or_staff(auth.uid()))'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;