ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;
UPDATE public.products SET sort_order = sub.rn FROM (SELECT id, row_number() OVER (ORDER BY created_at) AS rn FROM public.products) sub WHERE public.products.id = sub.id AND public.products.sort_order = 0;
CREATE INDEX IF NOT EXISTS idx_products_sort_order ON public.products(sort_order);