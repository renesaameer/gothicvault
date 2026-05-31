CREATE TABLE IF NOT EXISTS public.tracking_pixels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  pixel_id text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT false,
  access_token text DEFAULT '',
  test_event_code text DEFAULT '',
  advanced_matching boolean NOT NULL DEFAULT false,
  config jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tracking_pixels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read enabled pixels" ON public.tracking_pixels;
CREATE POLICY "Public can read enabled pixels" ON public.tracking_pixels FOR SELECT USING (enabled = true);
DROP POLICY IF EXISTS "Admin can manage pixels" ON public.tracking_pixels;
CREATE POLICY "Admin can manage pixels" ON public.tracking_pixels FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  discount_type text NOT NULL DEFAULT 'percentage',
  discount_value numeric NOT NULL DEFAULT 0,
  apply_to text NOT NULL DEFAULT 'all',
  target_ids uuid[] DEFAULT '{}',
  banner_image text DEFAULT '',
  enabled boolean NOT NULL DEFAULT true,
  start_date timestamptz,
  end_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read enabled offers" ON public.offers;
CREATE POLICY "Public can read enabled offers" ON public.offers FOR SELECT USING (enabled = true);
DROP POLICY IF EXISTS "Admin can manage offers" ON public.offers;
CREATE POLICY "Admin can manage offers" ON public.offers FOR ALL TO authenticated
  USING (public.is_admin_or_staff(auth.uid())) WITH CHECK (public.is_admin_or_staff(auth.uid()));

CREATE TABLE IF NOT EXISTS public.delivery_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  api_base_url text DEFAULT '',
  api_token text DEFAULT '',
  store_id text DEFAULT '',
  config jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.delivery_partners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin/staff can manage delivery partners" ON public.delivery_partners;
CREATE POLICY "Admin/staff can manage delivery partners" ON public.delivery_partners FOR ALL TO authenticated
  USING (public.is_admin_or_staff(auth.uid())) WITH CHECK (public.is_admin_or_staff(auth.uid()));