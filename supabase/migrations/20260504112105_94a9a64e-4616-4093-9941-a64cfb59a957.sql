-- ============================================================
-- Migration 2: Core commerce
-- ============================================================

-- ─── categories ───────────────────────────────────────────────
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX idx_categories_sort_order ON public.categories(sort_order);
CREATE TRIGGER categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── brands ───────────────────────────────────────────────────
CREATE TABLE public.brands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_brands_enabled ON public.brands(enabled);
CREATE TRIGGER brands_updated_at BEFORE UPDATE ON public.brands
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── products ─────────────────────────────────────────────────
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  price NUMERIC NOT NULL DEFAULT 0,
  sale_price NUMERIC,
  stock INTEGER NOT NULL DEFAULT 0,
  featured BOOLEAN NOT NULL DEFAULT false,
  best_seller BOOLEAN NOT NULL DEFAULT false,
  images TEXT[] NOT NULL DEFAULT '{}',
  short_description TEXT,
  description TEXT,
  sku TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
  rating NUMERIC NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  option_groups JSONB NOT NULL DEFAULT '[]'::jsonb,
  variants JSONB NOT NULL DEFAULT '[]'::jsonb,
  show_shipping_info BOOLEAN NOT NULL DEFAULT true,
  show_stock_status BOOLEAN NOT NULL DEFAULT true,
  show_offers BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_products_category_id ON public.products(category_id);
CREATE INDEX idx_products_brand_id ON public.products(brand_id);
CREATE INDEX idx_products_featured ON public.products(featured) WHERE featured;
CREATE INDEX idx_products_best_seller ON public.products(best_seller) WHERE best_seller;
CREATE INDEX idx_products_created_at ON public.products(created_at DESC);
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── product_variants ─────────────────────────────────────────
CREATE TABLE public.product_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  option_values JSONB NOT NULL DEFAULT '{}'::jsonb,
  price NUMERIC NOT NULL DEFAULT 0,
  sale_price NUMERIC,
  stock INTEGER NOT NULL DEFAULT 0,
  sku TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_product_variants_product_id ON public.product_variants(product_id);
CREATE TRIGGER product_variants_updated_at BEFORE UPDATE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── product_tabs ─────────────────────────────────────────────
CREATE TABLE public.product_tabs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  display_style TEXT NOT NULL DEFAULT 'text',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.product_tabs ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_product_tabs_product_id ON public.product_tabs(product_id);

-- ─── product_faqs ─────────────────────────────────────────────
CREATE TABLE public.product_faqs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.product_faqs ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_product_faqs_product_id ON public.product_faqs(product_id);

-- ─── product_offers ───────────────────────────────────────────
CREATE TABLE public.product_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  offer_type TEXT NOT NULL,
  buy_quantity INTEGER,
  get_quantity INTEGER,
  discount_value NUMERIC,
  free_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  display_text TEXT NOT NULL DEFAULT '',
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.product_offers ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_product_offers_product_id ON public.product_offers(product_id);
CREATE INDEX idx_product_offers_enabled ON public.product_offers(enabled) WHERE enabled;

-- ─── reviews ──────────────────────────────────────────────────
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  review TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_reviews_product_id ON public.reviews(product_id);

-- ============================================================
-- RLS Policies — public read, admin/staff write
-- ============================================================

-- categories: public read, admin write
CREATE POLICY "Public can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can insert categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_staff(auth.uid()));
CREATE POLICY "Admins can update categories" ON public.categories FOR UPDATE TO authenticated USING (public.is_admin_or_staff(auth.uid()));
CREATE POLICY "Admins can delete categories" ON public.categories FOR DELETE TO authenticated USING (public.is_admin_or_staff(auth.uid()));

-- brands: public read (only enabled), admin sees all
CREATE POLICY "Public can view enabled brands" ON public.brands FOR SELECT USING (enabled = true);
CREATE POLICY "Admins can view all brands" ON public.brands FOR SELECT TO authenticated USING (public.is_admin_or_staff(auth.uid()));
CREATE POLICY "Admins can insert brands" ON public.brands FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_staff(auth.uid()));
CREATE POLICY "Admins can update brands" ON public.brands FOR UPDATE TO authenticated USING (public.is_admin_or_staff(auth.uid()));
CREATE POLICY "Admins can delete brands" ON public.brands FOR DELETE TO authenticated USING (public.is_admin_or_staff(auth.uid()));

-- products: public read all, admin write
CREATE POLICY "Public can view products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admins can insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_staff(auth.uid()));
CREATE POLICY "Admins can update products" ON public.products FOR UPDATE TO authenticated USING (public.is_admin_or_staff(auth.uid()));
CREATE POLICY "Admins can delete products" ON public.products FOR DELETE TO authenticated USING (public.is_admin_or_staff(auth.uid()));

-- product_variants: public read active, admin sees all
CREATE POLICY "Public can view active variants" ON public.product_variants FOR SELECT USING (active = true);
CREATE POLICY "Admins can view all variants" ON public.product_variants FOR SELECT TO authenticated USING (public.is_admin_or_staff(auth.uid()));
CREATE POLICY "Admins can insert variants" ON public.product_variants FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_staff(auth.uid()));
CREATE POLICY "Admins can update variants" ON public.product_variants FOR UPDATE TO authenticated USING (public.is_admin_or_staff(auth.uid()));
CREATE POLICY "Admins can delete variants" ON public.product_variants FOR DELETE TO authenticated USING (public.is_admin_or_staff(auth.uid()));

-- product_tabs: public read, admin write
CREATE POLICY "Public can view product tabs" ON public.product_tabs FOR SELECT USING (true);
CREATE POLICY "Admins can insert product tabs" ON public.product_tabs FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_staff(auth.uid()));
CREATE POLICY "Admins can update product tabs" ON public.product_tabs FOR UPDATE TO authenticated USING (public.is_admin_or_staff(auth.uid()));
CREATE POLICY "Admins can delete product tabs" ON public.product_tabs FOR DELETE TO authenticated USING (public.is_admin_or_staff(auth.uid()));

-- product_faqs: public read, admin write
CREATE POLICY "Public can view product faqs" ON public.product_faqs FOR SELECT USING (true);
CREATE POLICY "Admins can insert product faqs" ON public.product_faqs FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_staff(auth.uid()));
CREATE POLICY "Admins can update product faqs" ON public.product_faqs FOR UPDATE TO authenticated USING (public.is_admin_or_staff(auth.uid()));
CREATE POLICY "Admins can delete product faqs" ON public.product_faqs FOR DELETE TO authenticated USING (public.is_admin_or_staff(auth.uid()));

-- product_offers: public read enabled, admin sees all
CREATE POLICY "Public can view enabled offers" ON public.product_offers FOR SELECT USING (enabled = true);
CREATE POLICY "Admins can view all offers" ON public.product_offers FOR SELECT TO authenticated USING (public.is_admin_or_staff(auth.uid()));
CREATE POLICY "Admins can insert offers" ON public.product_offers FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_staff(auth.uid()));
CREATE POLICY "Admins can update offers" ON public.product_offers FOR UPDATE TO authenticated USING (public.is_admin_or_staff(auth.uid()));
CREATE POLICY "Admins can delete offers" ON public.product_offers FOR DELETE TO authenticated USING (public.is_admin_or_staff(auth.uid()));

-- reviews: public read, admin write (admin adds them on behalf of customers)
CREATE POLICY "Public can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Admins can insert reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_staff(auth.uid()));
CREATE POLICY "Admins can update reviews" ON public.reviews FOR UPDATE TO authenticated USING (public.is_admin_or_staff(auth.uid()));
CREATE POLICY "Admins can delete reviews" ON public.reviews FOR DELETE TO authenticated USING (public.is_admin_or_staff(auth.uid()));

-- ============================================================
-- Storage bucket: media (public read, admin write)
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can read media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media');

CREATE POLICY "Admins can upload media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'media' AND public.is_admin_or_staff(auth.uid()));

CREATE POLICY "Admins can update media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'media' AND public.is_admin_or_staff(auth.uid()));

CREATE POLICY "Admins can delete media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'media' AND public.is_admin_or_staff(auth.uid()));