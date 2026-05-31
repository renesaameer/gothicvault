-- Migration 4: Remaining tables + helper RPCs

-- ============ SETTINGS SINGLETONS ============
CREATE TABLE public.design_settings (
  id text PRIMARY KEY,
  logo_desktop_url text,
  logo_mobile_url text,
  logo_footer_url text,
  favicon_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.design_settings (id) VALUES ('default');

CREATE TABLE public.whatsapp_settings (
  id text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT false,
  phone_number text NOT NULL DEFAULT '',
  radar_animation boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.whatsapp_settings (id) VALUES ('default');

CREATE TABLE public.footer_settings (
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
INSERT INTO public.footer_settings (id) VALUES ('default');

CREATE TABLE public.shop_settings (
  id text PRIMARY KEY,
  search_enabled boolean NOT NULL DEFAULT true,
  sorting_enabled boolean NOT NULL DEFAULT true,
  default_sorting text NOT NULL DEFAULT 'newest',
  card_cta_mode text NOT NULL DEFAULT 'view_details',
  card_show_view_details boolean NOT NULL DEFAULT true,
  card_show_add_to_cart boolean NOT NULL DEFAULT true,
  card_show_buy_now boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.shop_settings (id) VALUES ('default');

CREATE TABLE public.contact_settings (
  id text PRIMARY KEY,
  page_title text,
  page_intro text,
  phone_number text,
  email_address text,
  receiving_email text,
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
INSERT INTO public.contact_settings (id) VALUES ('default');

CREATE TABLE public.invoice_settings (
  id text PRIMARY KEY,
  store_name text,
  store_address text,
  store_phone text,
  store_email text,
  logo_url text,
  footer_text text,
  footer_note text,
  signature_label text,
  terms_text text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.invoice_settings (id) VALUES ('default');

CREATE TABLE public.floating_icons_settings (
  id text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT true,
  radar_animation boolean NOT NULL DEFAULT true,
  expand_icon_url text,
  animation_style text DEFAULT 'pulse',
  animation_intensity text DEFAULT 'medium',
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.floating_icons_settings (id) VALUES ('default');

-- ============ LISTS ============
CREATE TABLE public.floating_icons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL DEFAULT '',
  url text NOT NULL DEFAULT '',
  icon_url text,
  bg_color text NOT NULL DEFAULT '#000000',
  icon_color text DEFAULT '#ffffff',
  preset_key text,
  sort_order integer NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.direct_order_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled boolean NOT NULL DEFAULT true,
  label text NOT NULL DEFAULT '',
  identifier text NOT NULL DEFAULT '',
  message_template text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.tracking_pixels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  pixel_id text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT true,
  access_token text,
  test_event_code text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.about_sections (
  id text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.homepage_sections (
  id text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.delivery_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  shipping_cost numeric NOT NULL DEFAULT 0,
  free_shipping_threshold numeric,
  enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.delivery_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT false,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============ COMMERCE ============
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  email text,
  phone text,
  address text,
  city text,
  total_orders integer NOT NULL DEFAULT 0,
  total_spent numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL DEFAULT 'percentage',
  discount_value numeric NOT NULL DEFAULT 0,
  min_cart_total numeric DEFAULT 0,
  max_uses integer,
  used_count integer NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  start_date timestamptz,
  end_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  discount_type text NOT NULL DEFAULT 'percentage',
  discount_value numeric NOT NULL DEFAULT 0,
  apply_to text NOT NULL DEFAULT 'entire_store',
  target_ids text[],
  banner_image text,
  enabled boolean NOT NULL DEFAULT true,
  start_date timestamptz,
  end_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  customer_name text NOT NULL DEFAULT '',
  customer_email text,
  customer_phone text NOT NULL DEFAULT '',
  customer_address text NOT NULL DEFAULT '',
  customer_city text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric NOT NULL DEFAULT 0,
  shipping_cost numeric NOT NULL DEFAULT 0,
  discount_amount numeric NOT NULL DEFAULT 0,
  coupon_code text,
  total numeric NOT NULL DEFAULT 0,
  payment_method text DEFAULT 'cod',
  payment_status text NOT NULL DEFAULT 'pending',
  order_status text NOT NULL DEFAULT 'pending',
  tracking_number text,
  delivery_partner text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  subscribed_at timestamptz NOT NULL DEFAULT now()
);

-- Add missing column to product_offers
ALTER TABLE public.product_offers ADD COLUMN IF NOT EXISTS min_cart_total numeric;

-- ============ ENABLE RLS + POLICIES ============
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'design_settings','whatsapp_settings','footer_settings','shop_settings',
    'contact_settings','invoice_settings','floating_icons_settings',
    'floating_icons','direct_order_channels','tracking_pixels','policies',
    'about_sections','homepage_sections','delivery_zones','delivery_partners',
    'offers'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "Public read %1$s" ON public.%1$I FOR SELECT USING (true)', t);
    EXECUTE format('CREATE POLICY "Admins insert %1$s" ON public.%1$I FOR INSERT TO authenticated WITH CHECK (is_admin_or_staff(auth.uid()))', t);
    EXECUTE format('CREATE POLICY "Admins update %1$s" ON public.%1$I FOR UPDATE TO authenticated USING (is_admin_or_staff(auth.uid()))', t);
    EXECUTE format('CREATE POLICY "Admins delete %1$s" ON public.%1$I FOR DELETE TO authenticated USING (is_admin_or_staff(auth.uid()))', t);
  END LOOP;
END$$;

-- Customers (admin only)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage customers" ON public.customers FOR ALL TO authenticated
  USING (is_admin_or_staff(auth.uid())) WITH CHECK (is_admin_or_staff(auth.uid()));

-- Coupons (public can read enabled, admin manage)
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read enabled coupons" ON public.coupons FOR SELECT USING (enabled = true);
CREATE POLICY "Admins manage coupons" ON public.coupons FOR ALL TO authenticated
  USING (is_admin_or_staff(auth.uid())) WITH CHECK (is_admin_or_staff(auth.uid()));

-- Orders: public can insert (checkout), public can lookup by order_number/phone, admin manages
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can create orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can lookup orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Admins update orders" ON public.orders FOR UPDATE TO authenticated USING (is_admin_or_staff(auth.uid()));
CREATE POLICY "Admins delete orders" ON public.orders FOR DELETE TO authenticated USING (is_admin_or_staff(auth.uid()));

-- Contact submissions: public can insert, admin reads/manages
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can submit contact" ON public.contact_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins read contact" ON public.contact_submissions FOR SELECT TO authenticated USING (is_admin_or_staff(auth.uid()));
CREATE POLICY "Admins update contact" ON public.contact_submissions FOR UPDATE TO authenticated USING (is_admin_or_staff(auth.uid()));
CREATE POLICY "Admins delete contact" ON public.contact_submissions FOR DELETE TO authenticated USING (is_admin_or_staff(auth.uid()));

-- Newsletter: public insert via RPC, admin reads
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read subscribers" ON public.newsletter_subscribers FOR SELECT TO authenticated USING (is_admin_or_staff(auth.uid()));
CREATE POLICY "Admins delete subscribers" ON public.newsletter_subscribers FOR DELETE TO authenticated USING (is_admin_or_staff(auth.uid()));

-- ============ RPC FUNCTIONS ============
CREATE OR REPLACE FUNCTION public.subscribe_newsletter(_email text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.newsletter_subscribers (email) VALUES (lower(trim(_email)))
  ON CONFLICT (email) DO NOTHING;
END$$;
REVOKE EXECUTE ON FUNCTION public.subscribe_newsletter(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.subscribe_newsletter(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.decrement_product_stock(_product_id uuid, _quantity integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.products SET stock = GREATEST(0, stock - _quantity) WHERE id = _product_id;
END$$;
GRANT EXECUTE ON FUNCTION public.decrement_product_stock(uuid, integer) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.increment_coupon_usage(_code text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.coupons SET used_count = used_count + 1 WHERE code = _code;
END$$;
GRANT EXECUTE ON FUNCTION public.increment_coupon_usage(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.upsert_checkout_customer(
  _name text, _email text, _phone text, _address text, _city text, _order_total numeric
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE existing_id uuid;
BEGIN
  SELECT id INTO existing_id FROM public.customers
   WHERE phone = _phone OR (email IS NOT NULL AND email = _email) LIMIT 1;
  IF existing_id IS NULL THEN
    INSERT INTO public.customers (name, email, phone, address, city, total_orders, total_spent)
    VALUES (_name, _email, _phone, _address, _city, 1, COALESCE(_order_total,0));
  ELSE
    UPDATE public.customers SET
      name = COALESCE(NULLIF(_name,''), name),
      email = COALESCE(NULLIF(_email,''), email),
      address = COALESCE(NULLIF(_address,''), address),
      city = COALESCE(NULLIF(_city,''), city),
      total_orders = total_orders + 1,
      total_spent = total_spent + COALESCE(_order_total,0),
      updated_at = now()
    WHERE id = existing_id;
  END IF;
END$$;
GRANT EXECUTE ON FUNCTION public.upsert_checkout_customer(text,text,text,text,text,numeric) TO anon, authenticated;