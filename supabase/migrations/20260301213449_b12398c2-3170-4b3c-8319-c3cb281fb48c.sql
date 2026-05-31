
-- =============================================
-- 1. Brands table
-- =============================================
CREATE TABLE public.brands (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,
  description text,
  enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/staff can manage brands"
  ON public.brands FOR ALL
  USING (is_admin_or_staff(auth.uid()))
  WITH CHECK (is_admin_or_staff(auth.uid()));

CREATE POLICY "Public can read brands"
  ON public.brands FOR SELECT
  USING (true);

-- =============================================
-- 2. Nested categories: add parent_id
-- =============================================
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;

-- =============================================
-- 3. Add brand_id to products
-- =============================================
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL;

-- =============================================
-- 4. Card CTA mode in shop_settings
-- =============================================
ALTER TABLE public.shop_settings
  ADD COLUMN IF NOT EXISTS card_cta_mode text NOT NULL DEFAULT 'view_details';

-- =============================================
-- 5. Enhanced offers table for broader targeting
-- =============================================
CREATE TABLE public.offers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  discount_type text NOT NULL DEFAULT 'percentage',
  discount_value numeric NOT NULL DEFAULT 0,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  apply_to text NOT NULL DEFAULT 'specific_products',
  target_ids uuid[] DEFAULT '{}',
  banner_image text,
  featured boolean NOT NULL DEFAULT false,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/staff can manage offers"
  ON public.offers FOR ALL
  USING (is_admin_or_staff(auth.uid()))
  WITH CHECK (is_admin_or_staff(auth.uid()));

CREATE POLICY "Public can read active offers"
  ON public.offers FOR SELECT
  USING (enabled = true AND (end_date IS NULL OR end_date > now()));
