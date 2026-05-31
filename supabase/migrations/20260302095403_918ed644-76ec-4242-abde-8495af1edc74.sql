
-- Add customizable shipping and stock text fields to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS shipping_text text DEFAULT 'Free shipping on orders over ৳2000';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_status_text text DEFAULT 'In Stock — Ready to ship';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS show_shipping_text boolean DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS show_stock_status boolean DEFAULT true;
