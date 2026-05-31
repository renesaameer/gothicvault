ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS show_offers boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_shipping_info boolean NOT NULL DEFAULT true;

-- Backfill show_shipping_info from legacy show_shipping_text where applicable
UPDATE public.products SET show_shipping_info = show_shipping_text WHERE show_shipping_text IS NOT NULL;