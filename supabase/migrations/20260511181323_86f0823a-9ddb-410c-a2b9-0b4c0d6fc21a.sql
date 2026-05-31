-- Revoke EXECUTE on admin/internal SECURITY DEFINER functions from public roles.
-- These are called only from edge functions (service role) or triggers, never directly by clients.

REVOKE EXECUTE ON FUNCTION public.upsert_checkout_customer(text, text, text, numeric) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reverse_customer_order(text, numeric) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_coupon_usage(text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.decrement_coupon_usage(text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_product_stock(uuid, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.decrement_product_stock(uuid, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated;