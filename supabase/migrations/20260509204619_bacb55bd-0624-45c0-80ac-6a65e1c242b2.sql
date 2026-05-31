CREATE TABLE IF NOT EXISTS public.hero_slides (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  headline text,
  subheadline text,
  cta_text text,
  cta_link text,
  enabled boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read hero slides" ON public.hero_slides;
CREATE POLICY "Public can read hero slides" ON public.hero_slides FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin can manage hero slides" ON public.hero_slides;
CREATE POLICY "Admin can manage hero slides" ON public.hero_slides FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.shop_settings (id) VALUES ('default') ON CONFLICT DO NOTHING;

INSERT INTO public.about_sections (id, title, enabled, content, sort_order) VALUES
('header', 'Page Header', true, '{"title":"About RAREFINDS.","intro":"Crafted leather goods for collectors of quiet luxury."}', 1),
('story', 'Brand Story', true, '{"headline":"Our Story","text":"","image":""}', 2),
('mission_vision', 'Mission & Vision', true, '{"mission":"","vision":""}', 3),
('founder', 'Founder', true, '{"headline":"","message":"","image":""}', 4),
('values', 'Values', true, '{"cards":[]}', 5),
('cta', 'Call to Action', true, '{"text":"Discover the collection","button_text":"Shop Now","button_link":"/shop"}', 6)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.contact_settings (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;

INSERT INTO public.policies (id, title, content, enabled, sort_order) VALUES
('privacy', 'Privacy Policy', 'RAREFINDS. respects your privacy.', true, 1),
('refund', 'Refund Policy', '7-day easy returns on all RAREFINDS. orders.', true, 2),
('shipping', 'Shipping Policy', 'Inside Dhaka 1-2 days. Outside Dhaka 3-5 days.', true, 3),
('terms', 'Terms & Conditions', 'By using rarefinds.com you agree to our terms.', true, 4)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.design_settings (
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
ALTER TABLE public.design_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read design settings" ON public.design_settings;
CREATE POLICY "Public can read design settings" ON public.design_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin can manage design settings" ON public.design_settings;
CREATE POLICY "Admin can manage design settings" ON public.design_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.design_settings (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true) ON CONFLICT DO NOTHING;
DROP POLICY IF EXISTS "Public can view media files" ON storage.objects;
CREATE POLICY "Public can view media files" ON storage.objects FOR SELECT USING (bucket_id = 'media');
DROP POLICY IF EXISTS "Admin/staff can upload media" ON storage.objects;
CREATE POLICY "Admin/staff can upload media" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'media' AND public.is_admin_or_staff(auth.uid()));
DROP POLICY IF EXISTS "Admin/staff can update media" ON storage.objects;
CREATE POLICY "Admin/staff can update media" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'media' AND public.is_admin_or_staff(auth.uid()));
DROP POLICY IF EXISTS "Admin/staff can delete media" ON storage.objects;
CREATE POLICY "Admin/staff can delete media" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'media' AND public.is_admin_or_staff(auth.uid()));

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_homepage_sections_updated_at ON public.homepage_sections;
CREATE TRIGGER update_homepage_sections_updated_at BEFORE UPDATE ON public.homepage_sections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_about_sections_updated_at ON public.about_sections;
CREATE TRIGGER update_about_sections_updated_at BEFORE UPDATE ON public.about_sections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_contact_settings_updated_at ON public.contact_settings;
CREATE TRIGGER update_contact_settings_updated_at BEFORE UPDATE ON public.contact_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_policies_updated_at ON public.policies;
CREATE TRIGGER update_policies_updated_at BEFORE UPDATE ON public.policies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_design_settings_updated_at ON public.design_settings;
CREATE TRIGGER update_design_settings_updated_at BEFORE UPDATE ON public.design_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_whatsapp_settings_updated_at ON public.whatsapp_settings;
CREATE TRIGGER update_whatsapp_settings_updated_at BEFORE UPDATE ON public.whatsapp_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_shop_settings_updated_at ON public.shop_settings;
CREATE TRIGGER update_shop_settings_updated_at BEFORE UPDATE ON public.shop_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.delivery_zones (zone_name, areas, delivery_charge, free_delivery_minimum, estimated_days, sort_order) VALUES
('Inside Dhaka', 'Dhaka City, Mirpur, Uttara, Gulshan, Banani, Dhanmondi, Mohammadpur', 60, 1500, '1-2 days', 0),
('Outside Dhaka', 'All districts outside Dhaka', 120, 2000, '3-5 days', 1)
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.announcement_bar (
  id text PRIMARY KEY DEFAULT 'default',
  enabled boolean NOT NULL DEFAULT true,
  text text NOT NULL DEFAULT 'Complimentary shipping on orders over BDT 5,000',
  link text DEFAULT '',
  bg_color text NOT NULL DEFAULT '#000000',
  text_color text NOT NULL DEFAULT '#ffffff',
  dismissible boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.announcement_bar ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read announcement bar" ON public.announcement_bar;
CREATE POLICY "Public can read announcement bar" ON public.announcement_bar FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin can manage announcement bar" ON public.announcement_bar;
CREATE POLICY "Admin can manage announcement bar" ON public.announcement_bar FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.announcement_bar (id) VALUES ('default') ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.footer_settings (
  id text PRIMARY KEY DEFAULT 'default',
  store_name text NOT NULL DEFAULT 'RAREFINDS.',
  description text DEFAULT 'Crafted leather goods for collectors of quiet luxury.',
  email text DEFAULT '',
  phone text DEFAULT '',
  address text DEFAULT '',
  copyright_text text DEFAULT '© {year} RAREFINDS. All rights reserved.',
  newsletter_enabled boolean NOT NULL DEFAULT true,
  social_links jsonb NOT NULL DEFAULT '[]',
  quick_links jsonb NOT NULL DEFAULT '[]',
  customer_care_links jsonb NOT NULL DEFAULT '[]',
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.footer_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read footer settings" ON public.footer_settings;
CREATE POLICY "Public can read footer settings" ON public.footer_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin can manage footer settings" ON public.footer_settings;
CREATE POLICY "Admin can manage footer settings" ON public.footer_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.footer_settings (id, social_links, quick_links, customer_care_links) VALUES (
  'default',
  '[{"platform":"facebook","url":"","enabled":false,"icon_url":""},{"platform":"instagram","url":"","enabled":false,"icon_url":""}]'::jsonb,
  '[{"label":"Shop","url":"/shop"},{"label":"About","url":"/about"},{"label":"Contact","url":"/contact"}]'::jsonb,
  '[{"label":"Privacy Policy","url":"/policies/privacy"},{"label":"Shipping","url":"/policies/shipping"},{"label":"Returns","url":"/policies/refund"}]'::jsonb
) ON CONFLICT DO NOTHING;
DROP TRIGGER IF EXISTS update_footer_settings_updated_at ON public.footer_settings;
CREATE TRIGGER update_footer_settings_updated_at BEFORE UPDATE ON public.footer_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.invoice_settings (
  id text PRIMARY KEY DEFAULT 'default',
  store_name text DEFAULT 'RAREFINDS.',
  store_address text DEFAULT '',
  store_phone text DEFAULT '',
  store_email text DEFAULT '',
  logo_url text DEFAULT '',
  footer_note text DEFAULT 'Thank you for choosing RAREFINDS.',
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.invoice_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read invoice settings" ON public.invoice_settings;
CREATE POLICY "Public can read invoice settings" ON public.invoice_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin can manage invoice settings" ON public.invoice_settings;
CREATE POLICY "Admin can manage invoice settings" ON public.invoice_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.invoice_settings (id) VALUES ('default') ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.landing_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  template text NOT NULL DEFAULT 'default',
  sections jsonb NOT NULL DEFAULT '[]',
  theme jsonb NOT NULL DEFAULT '{}',
  enabled boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read enabled landing pages" ON public.landing_pages;
CREATE POLICY "Public can read enabled landing pages" ON public.landing_pages FOR SELECT USING (enabled = true);
DROP POLICY IF EXISTS "Admin/staff can manage landing pages" ON public.landing_pages;
CREATE POLICY "Admin/staff can manage landing pages" ON public.landing_pages FOR ALL TO authenticated
  USING (public.is_admin_or_staff(auth.uid())) WITH CHECK (public.is_admin_or_staff(auth.uid()));
DROP TRIGGER IF EXISTS update_landing_pages_updated_at ON public.landing_pages;
CREATE TRIGGER update_landing_pages_updated_at BEFORE UPDATE ON public.landing_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.landing_page_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_page_id uuid REFERENCES public.landing_pages(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  order_total numeric DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.landing_page_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can log landing events" ON public.landing_page_events;
CREATE POLICY "Anyone can log landing events" ON public.landing_page_events FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admin/staff can read landing events" ON public.landing_page_events;
CREATE POLICY "Admin/staff can read landing events" ON public.landing_page_events FOR SELECT TO authenticated
  USING (public.is_admin_or_staff(auth.uid()));