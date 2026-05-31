
-- Fix function search_path for security
ALTER FUNCTION public.decrement_product_stock(_product_id UUID, _quantity INT) SET search_path = public;
ALTER FUNCTION public.increment_coupon_usage(_code TEXT) SET search_path = public;
ALTER FUNCTION public.upsert_checkout_customer(_name TEXT, _email TEXT, _phone TEXT, _order_total NUMERIC) SET search_path = public;
ALTER FUNCTION public.subscribe_newsletter(_email TEXT) SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
