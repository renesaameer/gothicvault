
-- Drop duplicate / mis-roled admin policies
DROP POLICY IF EXISTS "Admin can manage offers" ON public.offers;
DROP POLICY IF EXISTS "Admin/staff can manage offers" ON public.offers;
DROP POLICY IF EXISTS "Public can read enabled offers" ON public.offers;
DROP POLICY IF EXISTS "Public can read active offers" ON public.offers;

DROP POLICY IF EXISTS "Admin can manage delivery partners" ON public.delivery_partners;
DROP POLICY IF EXISTS "Admin/staff can manage delivery partners" ON public.delivery_partners;

DROP POLICY IF EXISTS "Admin/staff can manage brands" ON public.brands;
DROP POLICY IF EXISTS "Admin can manage coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admin can manage delivery zones" ON public.delivery_zones;
DROP POLICY IF EXISTS "Admin/staff can manage featured categories" ON public.featured_categories;
DROP POLICY IF EXISTS "Admin can manage product offers" ON public.product_offers;

-- Recreate consistent single admin/staff manage policies (TO authenticated)
CREATE POLICY "Admin/staff can manage offers" ON public.offers
  FOR ALL TO authenticated
  USING (is_admin_or_staff(auth.uid()))
  WITH CHECK (is_admin_or_staff(auth.uid()));

CREATE POLICY "Public can read active offers" ON public.offers
  FOR SELECT TO anon, authenticated
  USING (enabled = true AND (end_date IS NULL OR end_date > now()));

CREATE POLICY "Admin/staff can manage delivery partners" ON public.delivery_partners
  FOR ALL TO authenticated
  USING (is_admin_or_staff(auth.uid()))
  WITH CHECK (is_admin_or_staff(auth.uid()));

CREATE POLICY "Admin/staff can manage brands" ON public.brands
  FOR ALL TO authenticated
  USING (is_admin_or_staff(auth.uid()))
  WITH CHECK (is_admin_or_staff(auth.uid()));

CREATE POLICY "Admin/staff can manage coupons" ON public.coupons
  FOR ALL TO authenticated
  USING (is_admin_or_staff(auth.uid()))
  WITH CHECK (is_admin_or_staff(auth.uid()));

CREATE POLICY "Admin/staff can manage delivery zones" ON public.delivery_zones
  FOR ALL TO authenticated
  USING (is_admin_or_staff(auth.uid()))
  WITH CHECK (is_admin_or_staff(auth.uid()));

CREATE POLICY "Admin/staff can manage featured categories" ON public.featured_categories
  FOR ALL TO authenticated
  USING (is_admin_or_staff(auth.uid()))
  WITH CHECK (is_admin_or_staff(auth.uid()));

CREATE POLICY "Admin/staff can manage product offers" ON public.product_offers
  FOR ALL TO authenticated
  USING (is_admin_or_staff(auth.uid()))
  WITH CHECK (is_admin_or_staff(auth.uid()));
