CREATE TABLE IF NOT EXISTS public.invoice_settings (
  id text PRIMARY KEY,
  store_name text, store_address text, store_phone text, store_email text,
  logo_url text, footer_text text, footer_note text, signature_label text, terms_text text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.floating_icons_settings (
  id text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT true,
  radar_animation boolean NOT NULL DEFAULT true,
  expand_icon_url text,
  animation_style text DEFAULT 'pulse',
  animation_intensity text DEFAULT 'medium',
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.floating_icons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL DEFAULT '', url text NOT NULL DEFAULT '',
  icon_url text, bg_color text NOT NULL DEFAULT '#000000',
  icon_color text DEFAULT '#ffffff', preset_key text,
  sort_order integer NOT NULL DEFAULT 0, enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.direct_order_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled boolean NOT NULL DEFAULT true,
  label text NOT NULL DEFAULT '', identifier text NOT NULL DEFAULT '',
  message_template text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.tracking_pixels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL, pixel_id text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT true,
  access_token text, test_event_code text,
  advanced_matching boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL DEFAULT '', content text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.about_sections (
  id text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.homepage_sections (
  id text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.delivery_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '', zone_name text,
  areas jsonb NOT NULL DEFAULT '[]'::jsonb,
  delivery_charge numeric NOT NULL DEFAULT 0,
  free_delivery_minimum numeric, estimated_days text,
  shipping_cost numeric NOT NULL DEFAULT 0,
  free_shipping_threshold numeric,
  enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.delivery_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, slug text NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT false,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  email text, phone text, address text, city text,
  total_orders integer NOT NULL DEFAULT 0,
  total_spent numeric NOT NULL DEFAULT 0, notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL DEFAULT 'percentage',
  discount_value numeric NOT NULL DEFAULT 0,
  min_cart_total numeric DEFAULT 0,
  min_order_amount numeric DEFAULT 0,
  max_uses integer, used_count integer NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  start_date timestamptz, end_date timestamptz, expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  discount_type text NOT NULL DEFAULT 'percentage',
  discount_value numeric NOT NULL DEFAULT 0,
  apply_to text NOT NULL DEFAULT 'entire_store',
  target_ids text[], banner_image text,
  enabled boolean NOT NULL DEFAULT true,
  start_date timestamptz, end_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  customer_name text NOT NULL DEFAULT '',
  customer_email text,
  customer_phone text NOT NULL DEFAULT '',
  customer_address text NOT NULL DEFAULT '',
  customer_city text,
  shipping_address jsonb NOT NULL DEFAULT '{}'::jsonb,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric NOT NULL DEFAULT 0,
  shipping_cost numeric NOT NULL DEFAULT 0,
  discount_amount numeric NOT NULL DEFAULT 0,
  coupon_code text,
  total numeric NOT NULL DEFAULT 0,
  payment_method text DEFAULT 'cod',
  payment_status text NOT NULL DEFAULT 'pending',
  order_status text NOT NULL DEFAULT 'pending',
  tracking_number text, delivery_partner text, notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, email text, phone text,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  subscribed_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.featured_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.categories(id) ON DELETE CASCADE,
  title text, image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.product_offers ADD COLUMN IF NOT EXISTS min_cart_total numeric;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'invoice_settings','floating_icons_settings','floating_icons',
    'direct_order_channels','tracking_pixels','policies',
    'about_sections','homepage_sections','delivery_zones','delivery_partners',
    'offers','featured_categories'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    BEGIN EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT USING (true)', 'pub_view_'||t, t); EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (is_admin_or_staff(auth.uid())) WITH CHECK (is_admin_or_staff(auth.uid()))', 'admins_manage_'||t, t); EXCEPTION WHEN duplicate_object THEN NULL; END;
  END LOOP;
END$$;

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN EXECUTE 'CREATE POLICY "Admins manage customers" ON public.customers FOR ALL TO authenticated USING (is_admin_or_staff(auth.uid())) WITH CHECK (is_admin_or_staff(auth.uid()))'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN EXECUTE 'CREATE POLICY "Public view enabled coupons" ON public.coupons FOR SELECT USING (enabled = true)'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN EXECUTE 'CREATE POLICY "Admins manage coupons" ON public.coupons FOR ALL TO authenticated USING (is_admin_or_staff(auth.uid())) WITH CHECK (is_admin_or_staff(auth.uid()))'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN EXECUTE 'CREATE POLICY "Public create orders" ON public.orders FOR INSERT WITH CHECK (true)'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN EXECUTE 'CREATE POLICY "Public view orders" ON public.orders FOR SELECT USING (true)'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN EXECUTE 'CREATE POLICY "Admins update orders" ON public.orders FOR UPDATE TO authenticated USING (is_admin_or_staff(auth.uid()))'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN EXECUTE 'CREATE POLICY "Admins delete orders" ON public.orders FOR DELETE TO authenticated USING (is_admin_or_staff(auth.uid()))'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN EXECUTE 'CREATE POLICY "Public submit contact" ON public.contact_submissions FOR INSERT WITH CHECK (true)'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN EXECUTE 'CREATE POLICY "Admins manage contact" ON public.contact_submissions FOR ALL TO authenticated USING (is_admin_or_staff(auth.uid())) WITH CHECK (is_admin_or_staff(auth.uid()))'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN EXECUTE 'CREATE POLICY "Admins manage subscribers" ON public.newsletter_subscribers FOR ALL TO authenticated USING (is_admin_or_staff(auth.uid())) WITH CHECK (is_admin_or_staff(auth.uid()))'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.subscribe_newsletter(_email text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.newsletter_subscribers (email) VALUES (lower(trim(_email)))
  ON CONFLICT (email) DO NOTHING;
END$$;
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
  _name text, _email text DEFAULT NULL, _phone text DEFAULT '',
  _order_total numeric DEFAULT 0, _address text DEFAULT NULL, _city text DEFAULT NULL
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE existing_id uuid;
BEGIN
  SELECT id INTO existing_id FROM public.customers
   WHERE (NULLIF(_phone,'') IS NOT NULL AND phone = _phone)
      OR (NULLIF(_email,'') IS NOT NULL AND email = _email)
   LIMIT 1;
  IF existing_id IS NULL THEN
    INSERT INTO public.customers (name, email, phone, address, city, total_orders, total_spent)
    VALUES (_name, _email, COALESCE(_phone,''), _address, _city, 1, COALESCE(_order_total,0));
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
GRANT EXECUTE ON FUNCTION public.upsert_checkout_customer(text,text,text,numeric,text,text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_public_tracking_pixels()
RETURNS TABLE(platform text, pixel_id text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT platform, pixel_id FROM public.tracking_pixels WHERE enabled = true AND pixel_id <> '';
$$;
GRANT EXECUTE ON FUNCTION public.get_public_tracking_pixels() TO anon, authenticated;