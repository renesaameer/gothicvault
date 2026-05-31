
-- 1) Remove broad SELECT policy on storage.objects for `media`.
-- The bucket is public (public=true), so direct object URLs continue to work
-- via the storage CDN, but anonymous LIST calls are no longer permitted.
DROP POLICY IF EXISTS "Public can view media files" ON storage.objects;

-- 2) Tighten EXECUTE on SECURITY DEFINER helpers.

-- Internal/admin-only helpers: no anon, no authenticated, no public
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Admin-only mutations (only invoked from admin pages by admin/staff role)
REVOKE EXECUTE ON FUNCTION public.reverse_customer_order(text, numeric) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.increment_product_stock(uuid, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.decrement_coupon_usage(text) FROM PUBLIC, anon;

-- Role check helpers — only authenticated needs to call them (used inside RLS policies)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_admin_or_staff(uuid) FROM PUBLIC, anon;

-- Note: the following remain callable by anon BY DESIGN (guest checkout / signup):
--   public.upsert_checkout_customer, public.decrement_product_stock,
--   public.increment_coupon_usage, public.subscribe_newsletter
