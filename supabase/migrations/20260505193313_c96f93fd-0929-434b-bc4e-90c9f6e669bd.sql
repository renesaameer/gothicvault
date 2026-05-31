ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_products_sort_order ON public.products(sort_order);
-- Seed initial order from creation date so existing products keep current visual order.
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) - 1 AS rn FROM public.products
)
UPDATE public.products p SET sort_order = ranked.rn FROM ranked WHERE ranked.id = p.id;