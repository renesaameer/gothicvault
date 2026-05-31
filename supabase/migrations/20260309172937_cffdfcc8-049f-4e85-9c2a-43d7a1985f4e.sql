
-- ========== ENUMS ==========
CREATE TYPE public.app_role AS ENUM ('admin', 'staff');

-- ========== CORE TABLES ==========

CREATE TABLE public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========== CATEGORIES & BRANDS ==========

CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  image_url TEXT,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  enabled BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read brands" ON public.brands FOR SELECT USING (true);
CREATE POLICY "Admins manage brands" ON public.brands FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ========== PRODUCTS ==========

CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  sale_price NUMERIC,
  images TEXT[] DEFAULT '{}',
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
  short_description TEXT,
  description TEXT,
  rating NUMERIC DEFAULT 0,
  review_count INT DEFAULT 0,
  stock INT DEFAULT 0,
  sku TEXT,
  featured BOOLEAN DEFAULT false,
  best_seller BOOLEAN DEFAULT false,
  variants JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admins manage products" ON public.products FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ========== ORDERS ==========

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT NOT NULL,
  shipping_address JSONB,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC NOT NULL DEFAULT 0,
  shipping_cost NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  coupon_code TEXT,
  total NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  payment_status TEXT DEFAULT 'pending',
  order_status TEXT DEFAULT 'pending',
  tracking_number TEXT,
  courier TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage orders" ON public.orders FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));
CREATE POLICY "Public can insert orders" ON public.orders FOR INSERT WITH CHECK (true);

-- ========== DELIVERY ZONES ==========

CREATE TABLE public.delivery_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_name TEXT NOT NULL,
  areas TEXT DEFAULT '',
  delivery_charge NUMERIC NOT NULL DEFAULT 0,
  free_delivery_minimum NUMERIC,
  estimated_days TEXT DEFAULT '3-5 days',
  enabled BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0
);
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read delivery zones" ON public.delivery_zones FOR SELECT USING (true);
CREATE POLICY "Admins manage delivery zones" ON public.delivery_zones FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Insert default delivery zones
INSERT INTO public.delivery_zones (zone_name, areas, delivery_charge, free_delivery_minimum, estimated_days, sort_order) VALUES
  ('Inside Dhaka', 'Dhaka, Mirpur, Uttara, Gulshan, Banani, Dhanmondi, Mohammadpur, Tejgaon', 80, 3000, '1-2 days', 0),
  ('Outside Dhaka', 'All other districts', 150, 5000, '3-5 days', 1);

-- ========== COUPONS ==========

CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL DEFAULT 'percentage',
  discount_value NUMERIC NOT NULL DEFAULT 0,
  min_order_amount NUMERIC DEFAULT 0,
  max_uses INT,
  used_count INT DEFAULT 0,
  enabled BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read coupons" ON public.coupons FOR SELECT USING (true);
CREATE POLICY "Admins manage coupons" ON public.coupons FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ========== OFFERS ==========

CREATE TABLE public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  discount_type TEXT NOT NULL DEFAULT 'percentage',
  discount_value NUMERIC NOT NULL DEFAULT 0,
  apply_to TEXT NOT NULL DEFAULT 'entire_store',
  target_ids TEXT[],
  banner_image TEXT,
  enabled BOOLEAN DEFAULT true,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read offers" ON public.offers FOR SELECT USING (true);
CREATE POLICY "Admins manage offers" ON public.offers FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ========== PRODUCT OFFERS ==========

CREATE TABLE public.product_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  offer_type TEXT NOT NULL DEFAULT 'discount',
  buy_quantity INT,
  get_quantity INT,
  free_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  discount_type TEXT,
  discount_value NUMERIC DEFAULT 0,
  display_text TEXT,
  enabled BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.product_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read product offers" ON public.product_offers FOR SELECT USING (true);
CREATE POLICY "Admins manage product offers" ON public.product_offers FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ========== REVIEWS ==========

CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  customer_name TEXT NOT NULL,
  rating INT NOT NULL DEFAULT 5,
  comment TEXT,
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read approved reviews" ON public.reviews FOR SELECT USING (approved = true);
CREATE POLICY "Anyone can insert reviews" ON public.reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins manage reviews" ON public.reviews FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ========== PRODUCT TABS & FAQS ==========

CREATE TABLE public.product_tabs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  sort_order INT DEFAULT 0
);
ALTER TABLE public.product_tabs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read product tabs" ON public.product_tabs FOR SELECT USING (true);
CREATE POLICY "Admins manage product tabs" ON public.product_tabs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.product_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INT DEFAULT 0
);
ALTER TABLE public.product_faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read product faqs" ON public.product_faqs FOR SELECT USING (true);
CREATE POLICY "Admins manage product faqs" ON public.product_faqs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ========== HOMEPAGE CONTENT ==========

CREATE TABLE public.hero_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  title TEXT,
  subtitle TEXT,
  button_text TEXT,
  button_link TEXT,
  enabled BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0
);
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read hero slides" ON public.hero_slides FOR SELECT USING (true);
CREATE POLICY "Admins manage hero slides" ON public.hero_slides FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.homepage_sections (
  id TEXT PRIMARY KEY,
  enabled BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  content JSONB DEFAULT '{}'
);
ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read homepage sections" ON public.homepage_sections FOR SELECT USING (true);
CREATE POLICY "Admins manage homepage sections" ON public.homepage_sections FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Insert default homepage sections
INSERT INTO public.homepage_sections (id, enabled, sort_order, content) VALUES
  ('hero', true, 0, '{"title": "Step Into Luxury", "subtitle": "Premium bags & accessories for the modern woman", "button_text": "Shop Now", "button_link": "/shop"}'),
  ('featured', true, 1, '{"section_title": "Featured Collection", "subtitle": "Handpicked luxury pieces"}'),
  ('bestsellers', true, 2, '{"section_title": "Best Sellers", "subtitle": "Most loved by our customers"}'),
  ('categories_showcase', true, 3, '{"section_title": "Shop by Category"}'),
  ('brands_showcase', true, 4, '{"section_title": "Our Brands"}'),
  ('brand_story', true, 5, '{"title": "Our Story", "text": "Step & Style was born from a passion for accessible luxury.", "button_text": "Read More", "button_link": "/about"}'),
  ('why_choose_us', true, 6, '{}'),
  ('testimonials', true, 7, '{}'),
  ('faq', true, 8, '{}'),
  ('newsletter', true, 9, '{"title": "Join Our Newsletter", "subtitle": "Get exclusive offers and updates"}');

CREATE TABLE public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  review TEXT NOT NULL,
  rating INT DEFAULT 5,
  image_url TEXT,
  sort_order INT DEFAULT 0
);
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read testimonials" ON public.testimonials FOR SELECT USING (true);
CREATE POLICY "Admins manage testimonials" ON public.testimonials FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.home_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INT DEFAULT 0
);
ALTER TABLE public.home_faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read home faqs" ON public.home_faqs FOR SELECT USING (true);
CREATE POLICY "Admins manage home faqs" ON public.home_faqs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.why_choose_us_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  icon_name TEXT DEFAULT 'Shield',
  title TEXT NOT NULL,
  description TEXT,
  sort_order INT DEFAULT 0
);
ALTER TABLE public.why_choose_us_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read why choose us" ON public.why_choose_us_cards FOR SELECT USING (true);
CREATE POLICY "Admins manage why choose us" ON public.why_choose_us_cards FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ========== ABOUT SECTIONS ==========

CREATE TABLE public.about_sections (
  id TEXT PRIMARY KEY,
  enabled BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  content JSONB DEFAULT '{}'
);
ALTER TABLE public.about_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read about sections" ON public.about_sections FOR SELECT USING (true);
CREATE POLICY "Admins manage about sections" ON public.about_sections FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.about_sections (id, enabled, sort_order, content) VALUES
  ('header', true, 0, '{"title": "About Step & Style", "intro": "Curating premium bags & accessories for the modern Bangladeshi woman since 2020."}'),
  ('story', true, 1, '{"headline": "Our Story", "text": "Step & Style was born from a passion for luxury accessories and a desire to bring world-class bag designs to Bangladesh."}'),
  ('mission_vision', true, 2, '{"mission": "To make luxury accessible to every woman in Bangladesh.", "vision": "To become the most trusted premium bag brand in South Asia."}'),
  ('founder', false, 3, '{}'),
  ('values', true, 4, '{"cards": [{"icon": "Shield", "title": "Quality First", "description": "Every product passes strict quality checks."}, {"icon": "Heart", "title": "Customer Love", "description": "Your satisfaction is our top priority."}, {"icon": "Truck", "title": "Fast Delivery", "description": "Nationwide delivery within 1-5 days."}, {"icon": "RefreshCw", "title": "Easy Returns", "description": "7-day hassle-free return policy."}]}'),
  ('cta', true, 5, '{"text": "Find Your Perfect Bag", "button_text": "Shop Now", "button_link": "/shop"}');

-- ========== SETTINGS TABLES ==========

CREATE TABLE public.design_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  logo_desktop_url TEXT,
  logo_mobile_url TEXT,
  logo_footer_url TEXT,
  primary_color TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.design_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read design settings" ON public.design_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage design settings" ON public.design_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.design_settings (id) VALUES ('default');

CREATE TABLE public.shop_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  search_enabled BOOLEAN DEFAULT true,
  sorting_enabled BOOLEAN DEFAULT true,
  default_sorting TEXT DEFAULT 'newest',
  card_cta_mode TEXT DEFAULT 'view_details'
);
ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read shop settings" ON public.shop_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage shop settings" ON public.shop_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.shop_settings (id) VALUES ('default');

CREATE TABLE public.whatsapp_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  phone_number TEXT DEFAULT '',
  enabled BOOLEAN DEFAULT false,
  radar_animation BOOLEAN DEFAULT true
);
ALTER TABLE public.whatsapp_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read whatsapp settings" ON public.whatsapp_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage whatsapp settings" ON public.whatsapp_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.whatsapp_settings (id) VALUES ('default');

CREATE TABLE public.announcement_bar (
  id TEXT PRIMARY KEY DEFAULT 'default',
  enabled BOOLEAN DEFAULT false,
  text TEXT DEFAULT '',
  link TEXT,
  bg_color TEXT DEFAULT '#000000',
  text_color TEXT DEFAULT '#ffffff',
  dismissible BOOLEAN DEFAULT true
);
ALTER TABLE public.announcement_bar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read announcement bar" ON public.announcement_bar FOR SELECT USING (true);
CREATE POLICY "Admins manage announcement bar" ON public.announcement_bar FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.announcement_bar (id) VALUES ('default');

CREATE TABLE public.contact_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  page_title TEXT DEFAULT 'Get in Touch',
  page_intro TEXT DEFAULT 'We would love to hear from you.',
  phone_number TEXT DEFAULT '+880 1XXX-XXXXXX',
  email_address TEXT DEFAULT 'hello@stepandstyle.com',
  show_address BOOLEAN DEFAULT true,
  business_address TEXT DEFAULT 'Dhaka, Bangladesh',
  phone_field_enabled BOOLEAN DEFAULT true,
  submit_button_text TEXT DEFAULT 'Send Message',
  social_section_enabled BOOLEAN DEFAULT true,
  social_links JSONB DEFAULT '[{"label":"Facebook","url":"https://facebook.com/stepandstyle"},{"label":"Instagram","url":"https://instagram.com/stepandstyle"}]',
  faq_shortcut_enabled BOOLEAN DEFAULT true,
  faq_shortcut_items JSONB DEFAULT '[{"question":"How long does delivery take?","answer":"Inside Dhaka: 1-2 days. Outside Dhaka: 3-5 days."},{"question":"Can I return a product?","answer":"Yes! We offer 7-day easy returns for damaged or mismatched products."}]',
  map_enabled BOOLEAN DEFAULT false,
  map_embed TEXT
);
ALTER TABLE public.contact_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read contact settings" ON public.contact_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage contact settings" ON public.contact_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.contact_settings (id) VALUES ('default');

CREATE TABLE public.contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit contact" ON public.contact_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins read submissions" ON public.contact_submissions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ========== TRACKING PIXELS ==========

CREATE TABLE public.tracking_pixels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  pixel_id TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tracking_pixels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read tracking pixels" ON public.tracking_pixels FOR SELECT USING (true);
CREATE POLICY "Admins manage tracking pixels" ON public.tracking_pixels FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ========== NEWSLETTER & CUSTOMERS ==========

CREATE TABLE public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read subscribers" ON public.newsletter_subscribers FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);

CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT UNIQUE,
  total_orders INT DEFAULT 1,
  total_spent NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage customers" ON public.customers FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

-- ========== DATABASE FUNCTIONS ==========

CREATE OR REPLACE FUNCTION public.decrement_product_stock(_product_id UUID, _quantity INT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.products SET stock = GREATEST(0, stock - _quantity) WHERE id = _product_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_coupon_usage(_code TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.coupons SET used_count = used_count + 1 WHERE code = _code;
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_checkout_customer(_name TEXT, _email TEXT, _phone TEXT, _order_total NUMERIC)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.customers (name, email, phone, total_orders, total_spent)
  VALUES (_name, _email, NULLIF(_phone, ''), 1, _order_total)
  ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    total_orders = customers.total_orders + 1,
    total_spent = customers.total_spent + EXCLUDED.total_spent,
    updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.subscribe_newsletter(_email TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.newsletter_subscribers (email) VALUES (_email) ON CONFLICT (email) DO NOTHING;
END;
$$;
