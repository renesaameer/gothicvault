
-- =============================================
-- ANNOUNCEMENT BAR
-- =============================================
CREATE TABLE public.announcement_bar (
  id text PRIMARY KEY DEFAULT 'default',
  enabled boolean NOT NULL DEFAULT true,
  text text NOT NULL DEFAULT 'Free shipping on orders over ৳2000',
  link text DEFAULT '',
  bg_color text NOT NULL DEFAULT '#000000',
  text_color text NOT NULL DEFAULT '#ffffff',
  dismissible boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.announcement_bar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read announcement bar" ON public.announcement_bar FOR SELECT USING (true);
CREATE POLICY "Admin can manage announcement bar" ON public.announcement_bar FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.announcement_bar (id) VALUES ('default');

-- =============================================
-- FOOTER SETTINGS (with new icon_url support inside social_links jsonb)
-- =============================================
CREATE TABLE public.footer_settings (
  id text PRIMARY KEY DEFAULT 'default',
  store_name text NOT NULL DEFAULT 'Step & Style',
  description text DEFAULT 'Premium bags for every occasion.',
  email text DEFAULT '',
  phone text DEFAULT '',
  address text DEFAULT '',
  copyright_text text DEFAULT '© {year} Step & Style. All rights reserved.',
  newsletter_enabled boolean NOT NULL DEFAULT true,
  social_links jsonb NOT NULL DEFAULT '[]',
  quick_links jsonb NOT NULL DEFAULT '[]',
  customer_care_links jsonb NOT NULL DEFAULT '[]',
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.footer_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read footer settings" ON public.footer_settings FOR SELECT USING (true);
CREATE POLICY "Admin can manage footer settings" ON public.footer_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.footer_settings (id, social_links, quick_links, customer_care_links) VALUES (
  'default',
  '[{"platform":"facebook","url":"","enabled":false,"icon_url":""},{"platform":"instagram","url":"","enabled":false,"icon_url":""},{"platform":"twitter","url":"","enabled":false,"icon_url":""}]'::jsonb,
  '[{"label":"Shop","url":"/shop"},{"label":"About","url":"/about"},{"label":"Contact","url":"/contact"}]'::jsonb,
  '[{"label":"Privacy Policy","url":"/policies/privacy"},{"label":"Shipping","url":"/policies/shipping"},{"label":"Returns","url":"/policies/refund"}]'::jsonb
);
CREATE TRIGGER update_footer_settings_updated_at BEFORE UPDATE ON public.footer_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- TRACKING PIXELS
-- =============================================
CREATE TABLE public.tracking_pixels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  pixel_id text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT false,
  access_token text DEFAULT '',
  test_event_code text DEFAULT '',
  advanced_matching boolean NOT NULL DEFAULT false,
  config jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tracking_pixels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read enabled pixels" ON public.tracking_pixels FOR SELECT USING (enabled = true);
CREATE POLICY "Admin can manage pixels" ON public.tracking_pixels FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- INVOICE SETTINGS
-- =============================================
CREATE TABLE public.invoice_settings (
  id text PRIMARY KEY DEFAULT 'default',
  store_name text DEFAULT 'Step & Style',
  store_address text DEFAULT '',
  store_phone text DEFAULT '',
  store_email text DEFAULT '',
  logo_url text DEFAULT '',
  footer_note text DEFAULT 'Thank you for shopping with us!',
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.invoice_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read invoice settings" ON public.invoice_settings FOR SELECT USING (true);
CREATE POLICY "Admin can manage invoice settings" ON public.invoice_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.invoice_settings (id) VALUES ('default');

-- =============================================
-- DELIVERY PARTNERS (Pathao, RedX, etc.)
-- =============================================
CREATE TABLE public.delivery_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  api_base_url text DEFAULT '',
  api_token text DEFAULT '',
  store_id text DEFAULT '',
  config jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.delivery_partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin/staff can manage delivery partners" ON public.delivery_partners FOR ALL TO authenticated
  USING (public.is_admin_or_staff(auth.uid())) WITH CHECK (public.is_admin_or_staff(auth.uid()));

-- =============================================
-- LANDING PAGES
-- =============================================
CREATE TABLE public.landing_pages (
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
CREATE POLICY "Public can read enabled landing pages" ON public.landing_pages FOR SELECT USING (enabled = true);
CREATE POLICY "Admin/staff can manage landing pages" ON public.landing_pages FOR ALL TO authenticated
  USING (public.is_admin_or_staff(auth.uid())) WITH CHECK (public.is_admin_or_staff(auth.uid()));
CREATE TRIGGER update_landing_pages_updated_at BEFORE UPDATE ON public.landing_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- LANDING PAGE EVENTS (analytics)
-- =============================================
CREATE TABLE public.landing_page_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_page_id uuid REFERENCES public.landing_pages(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  order_total numeric DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.landing_page_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can log landing events" ON public.landing_page_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin/staff can read landing events" ON public.landing_page_events FOR SELECT TO authenticated
  USING (public.is_admin_or_staff(auth.uid()));

-- =============================================
-- OFFERS (top-level promotion banners)
-- =============================================
CREATE TABLE public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  discount_type text NOT NULL DEFAULT 'percentage',
  discount_value numeric NOT NULL DEFAULT 0,
  apply_to text NOT NULL DEFAULT 'all',
  target_ids uuid[] DEFAULT '{}',
  banner_image text DEFAULT '',
  enabled boolean NOT NULL DEFAULT true,
  start_date timestamptz,
  end_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read enabled offers" ON public.offers FOR SELECT USING (enabled = true);
CREATE POLICY "Admin can manage offers" ON public.offers FOR ALL TO authenticated
  USING (public.is_admin_or_staff(auth.uid())) WITH CHECK (public.is_admin_or_staff(auth.uid()));

-- =============================================
-- NEW FEATURE: PRODUCT VARIANTS
-- =============================================
CREATE TABLE public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  -- option_values is a JSON object like {"Color":"Blue","Size":"L"}
  option_values jsonb NOT NULL DEFAULT '{}',
  price numeric(10,2) NOT NULL DEFAULT 0,
  sale_price numeric(10,2),
  stock int NOT NULL DEFAULT 0,
  sku text DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX product_variants_product_id_idx ON public.product_variants(product_id);
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read product variants" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "Admin/staff can manage product variants" ON public.product_variants FOR ALL TO authenticated
  USING (public.is_admin_or_staff(auth.uid())) WITH CHECK (public.is_admin_or_staff(auth.uid()));
CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add option_groups column on products: stores list of {name:"Color", values:["Blue","Red"]}
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS option_groups jsonb NOT NULL DEFAULT '[]';

-- =============================================
-- NEW FEATURE: FLOATING ICONS WIDGET
-- =============================================
CREATE TABLE public.floating_icons_settings (
  id text PRIMARY KEY DEFAULT 'default',
  enabled boolean NOT NULL DEFAULT true,
  radar_animation boolean NOT NULL DEFAULT true,
  expand_icon_url text DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.floating_icons_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read floating icons settings" ON public.floating_icons_settings FOR SELECT USING (true);
CREATE POLICY "Admin can manage floating icons settings" ON public.floating_icons_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.floating_icons_settings (id) VALUES ('default');

CREATE TABLE public.floating_icons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  url text NOT NULL,
  icon_url text DEFAULT '',
  bg_color text NOT NULL DEFAULT '#25D366',
  enabled boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX floating_icons_sort_idx ON public.floating_icons(sort_order);
ALTER TABLE public.floating_icons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read enabled floating icons" ON public.floating_icons FOR SELECT USING (enabled = true);
CREATE POLICY "Admin can manage floating icons" ON public.floating_icons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- SECURITY HARDENING: lock down SECURITY DEFINER fns to authenticated/anon as needed
-- =============================================
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.is_admin_or_staff(uuid) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_coupon_usage(text) FROM public;
REVOKE EXECUTE ON FUNCTION public.upsert_checkout_customer(text, text, text, numeric) FROM public;
REVOKE EXECUTE ON FUNCTION public.decrement_product_stock(uuid, int) FROM public;
REVOKE EXECUTE ON FUNCTION public.subscribe_newsletter(text) FROM public;

-- Restrict storage.objects listing on public bucket: keep SELECT but require known path or auth for listing root
-- (the current policy is fine for public-read; listing is unavoidable on a truly public bucket)

-- =============================================
-- SEED DEMO DATA
-- =============================================
INSERT INTO public.products (name, slug, short_description, description, price, sale_price, stock, rating, review_count, featured, best_seller, images) VALUES
('Classic Tote Bag', 'classic-tote-bag', 'Timeless leather tote for everyday use', 'A spacious leather tote with reinforced handles and interior pockets.', 1850, 1499, 45, 4.8, 124, true, true, ARRAY['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600']),
('Mini Crossbody', 'mini-crossbody', 'Compact crossbody for essentials', 'Sleek crossbody with adjustable strap and gold-tone hardware.', 1200, NULL, 80, 4.6, 89, true, false, ARRAY['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600']),
('Evening Clutch', 'evening-clutch', 'Elegant clutch for special occasions', 'Hand-stitched evening clutch with detachable chain.', 950, 799, 60, 4.7, 67, true, true, ARRAY['https://images.unsplash.com/photo-1591561954557-26941169b49e?w=600']),
('Backpack Pro', 'backpack-pro', 'Travel backpack with laptop compartment', 'Durable backpack with padded laptop sleeve, USB port, and water-resistant coating.', 2400, 1999, 30, 4.9, 156, true, true, ARRAY['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600']);

INSERT INTO public.testimonials (name, review, rating, sort_order) VALUES
('Fatima Rahman', 'The Classic Tote is gorgeous and so well made. Worth every taka!', 5, 0),
('Nadia Akter', 'Fast delivery and beautiful packaging. The Mini Crossbody is now my favorite.', 5, 1),
('Aisha Khan', 'Love the quality and style. Will definitely order again.', 4, 2);

INSERT INTO public.why_choose_us_cards (title, description, icon_name, sort_order) VALUES
('100% Authentic', 'Every bag is genuine leather, sourced ethically', 'Shield', 0),
('Free Delivery', 'Free shipping on orders above ৳2000', 'Truck', 1),
('Easy Returns', '7-day no-questions-asked returns', 'RotateCcw', 2),
('Secure Payments', 'bKash, Nagad, COD, and bank transfer', 'Lock', 3);

INSERT INTO public.home_faqs (question, answer, sort_order) VALUES
('How long does delivery take?', 'Inside Dhaka: 1-2 days. Outside Dhaka: 3-5 days.', 0),
('Are your bags genuine leather?', 'Yes, every bag is crafted from genuine top-grain leather.', 1),
('Do you accept Cash on Delivery?', 'Yes, COD is available across Bangladesh.', 2);

INSERT INTO public.floating_icons (label, url, icon_url, bg_color, sort_order) VALUES
('WhatsApp', 'https://wa.me/8801700000000', '', '#25D366', 0);
