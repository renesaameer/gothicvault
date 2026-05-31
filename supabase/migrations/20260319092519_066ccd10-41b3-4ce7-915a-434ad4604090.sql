ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS show_shipping_text boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS shipping_text text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS show_stock_status boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS stock_status_text text DEFAULT NULL;