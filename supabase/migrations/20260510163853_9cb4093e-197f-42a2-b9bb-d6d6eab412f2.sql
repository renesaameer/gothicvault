UPDATE public.footer_settings
SET store_name = 'Nupur Abaya And More',
    copyright_text = '© {year} Nupur Abaya And More. All rights reserved.'
WHERE id = 'default'
  AND (store_name IS NULL OR store_name = '' OR store_name = 'RAREFINDS.');

DROP FUNCTION IF EXISTS public.validate_coupon(text, numeric);

CREATE OR REPLACE FUNCTION public.validate_coupon(_code text, _cart_total numeric)
 RETURNS TABLE(valid boolean, code text, discount_type text, discount_value numeric, min_order_amount numeric, error text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  c public.coupons%ROWTYPE;
BEGIN
  SELECT * INTO c
  FROM public.coupons
  WHERE coupons.code = upper(trim(_code))
    AND enabled = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::text, NULL::text, NULL::numeric, NULL::numeric, 'Invalid coupon code'::text;
    RETURN;
  END IF;

  IF c.expires_at IS NOT NULL AND c.expires_at < now() THEN
    RETURN QUERY SELECT false, c.code, c.discount_type, c.discount_value, c.min_order_amount, 'Coupon has expired'::text;
    RETURN;
  END IF;

  IF c.max_uses IS NOT NULL AND c.used_count >= c.max_uses THEN
    RETURN QUERY SELECT false, c.code, c.discount_type, c.discount_value, c.min_order_amount, 'Coupon usage limit reached'::text;
    RETURN;
  END IF;

  IF c.min_order_amount IS NOT NULL AND _cart_total < c.min_order_amount THEN
    RETURN QUERY SELECT false, c.code, c.discount_type, c.discount_value, c.min_order_amount, 'MIN_ORDER'::text;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, c.code, c.discount_type, c.discount_value, c.min_order_amount, NULL::text;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.validate_coupon(text, numeric) FROM public;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text, numeric) TO anon, authenticated;