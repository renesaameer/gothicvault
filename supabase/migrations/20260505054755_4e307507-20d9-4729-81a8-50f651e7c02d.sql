DROP POLICY IF EXISTS "Public read delivery_partners" ON public.delivery_partners;
CREATE POLICY "Admins read delivery_partners" ON public.delivery_partners
  FOR SELECT TO authenticated USING (is_admin_or_staff(auth.uid()));