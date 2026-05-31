
-- =========================================================
-- 1) ORDERS — kill the public-read leak; add safe tracking RPCs
-- =========================================================
DROP POLICY IF EXISTS "Anyone can track orders by number" ON public.orders;

CREATE OR REPLACE FUNCTION public.track_order(_order_number text)
RETURNS TABLE (
  id uuid,
  order_number text,
  customer_name text,
  customer_phone text,
  shipping_address jsonb,
  items jsonb,
  subtotal numeric,
  shipping_cost numeric,
  discount_amount numeric,
  total numeric,
  payment_status text,
  order_status text,
  tracking_number text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, order_number, customer_name, customer_phone, shipping_address, items,
         subtotal, shipping_cost, discount_amount, total, payment_status,
         order_status, tracking_number, created_at, updated_at
  FROM public.orders
  WHERE order_number = _order_number
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.track_orders_by_phone(_phone text)
RETURNS TABLE (
  id uuid,
  order_number text,
  customer_name text,
  customer_phone text,
  shipping_address jsonb,
  items jsonb,
  subtotal numeric,
  shipping_cost numeric,
  discount_amount numeric,
  total numeric,
  payment_status text,
  order_status text,
  tracking_number text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, order_number, customer_name, customer_phone, shipping_address, items,
         subtotal, shipping_cost, discount_amount, total, payment_status,
         order_status, tracking_number, created_at, updated_at
  FROM public.orders
  WHERE customer_phone = _phone
  ORDER BY created_at DESC
  LIMIT 50;
$$;

REVOKE EXECUTE ON FUNCTION public.track_order(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.track_orders_by_phone(text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.track_order(text) TO anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.track_orders_by_phone(text) TO anon, authenticated;

-- =========================================================
-- 2) TRACKING PIXELS — hide access_token / test_event_code
-- =========================================================
DROP POLICY IF EXISTS "Public can read enabled pixels" ON public.tracking_pixels;

CREATE OR REPLACE FUNCTION public.get_public_tracking_pixels()
RETURNS TABLE (
  id uuid,
  platform text,
  pixel_id text,
  enabled boolean,
  advanced_matching boolean,
  config jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, platform, pixel_id, enabled, advanced_matching, config
  FROM public.tracking_pixels
  WHERE enabled = true;
$$;

REVOKE EXECUTE ON FUNCTION public.get_public_tracking_pixels() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_public_tracking_pixels() TO anon, authenticated;

-- =========================================================
-- 3) CONTACT SETTINGS — hide receiving_email
-- =========================================================
DROP POLICY IF EXISTS "Public can read contact settings" ON public.contact_settings;

CREATE OR REPLACE FUNCTION public.get_public_contact_settings()
RETURNS TABLE (
  id text,
  page_title text,
  page_intro text,
  email_address text,
  phone_number text,
  business_address text,
  show_address boolean,
  phone_field_enabled boolean,
  submit_button_text text,
  social_links jsonb,
  social_section_enabled boolean,
  faq_shortcut_items jsonb,
  faq_shortcut_enabled boolean,
  map_embed text,
  map_enabled boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, page_title, page_intro, email_address, phone_number, business_address,
         show_address, phone_field_enabled, submit_button_text, social_links,
         social_section_enabled, faq_shortcut_items, faq_shortcut_enabled,
         map_embed, map_enabled
  FROM public.contact_settings
  WHERE id = 'default'
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.get_public_contact_settings() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_public_contact_settings() TO anon, authenticated;

-- =========================================================
-- 4) INVOICE SETTINGS — admin-only
-- =========================================================
DROP POLICY IF EXISTS "Public can read invoice settings" ON public.invoice_settings;
-- Existing "Admin can manage invoice settings" policy remains.

-- =========================================================
-- 5) COUPONS — validate via RPC; restrict raw table reads
-- =========================================================
DROP POLICY IF EXISTS "Public can read enabled coupons" ON public.coupons;

CREATE OR REPLACE FUNCTION public.validate_coupon(_code text, _cart_total numeric)
RETURNS TABLE (
  valid boolean,
  code text,
  discount_type text,
  discount_value numeric,
  error text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c public.coupons%ROWTYPE;
BEGIN
  SELECT * INTO c
  FROM public.coupons
  WHERE coupons.code = upper(trim(_code))
    AND enabled = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::text, NULL::text, NULL::numeric, 'Invalid coupon code'::text;
    RETURN;
  END IF;

  IF c.expires_at IS NOT NULL AND c.expires_at < now() THEN
    RETURN QUERY SELECT false, c.code, c.discount_type, c.discount_value, 'Coupon has expired'::text;
    RETURN;
  END IF;

  IF c.max_uses IS NOT NULL AND c.used_count >= c.max_uses THEN
    RETURN QUERY SELECT false, c.code, c.discount_type, c.discount_value, 'Coupon usage limit reached'::text;
    RETURN;
  END IF;

  IF c.min_order_amount IS NOT NULL AND _cart_total < c.min_order_amount THEN
    RETURN QUERY SELECT false, c.code, c.discount_type, c.discount_value,
      ('Minimum order ' || c.min_order_amount::text || ' required')::text;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, c.code, c.discount_type, c.discount_value, NULL::text;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.validate_coupon(text, numeric) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.validate_coupon(text, numeric) TO anon, authenticated;
