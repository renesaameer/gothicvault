
-- Delivery zones/rates table
CREATE TABLE public.delivery_zones (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_name text NOT NULL,
  areas text NOT NULL DEFAULT '',
  delivery_charge numeric NOT NULL DEFAULT 0,
  free_delivery_minimum numeric DEFAULT NULL,
  estimated_days text DEFAULT '3-5 days',
  enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage delivery zones" ON public.delivery_zones FOR ALL USING (is_admin_or_staff(auth.uid())) WITH CHECK (is_admin_or_staff(auth.uid()));
CREATE POLICY "Public can read delivery zones" ON public.delivery_zones FOR SELECT USING (true);

-- Product offers table
CREATE TABLE public.product_offers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  offer_type text NOT NULL,
  buy_quantity integer DEFAULT NULL,
  get_quantity integer DEFAULT NULL,
  discount_value numeric DEFAULT NULL,
  free_product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  min_cart_total numeric DEFAULT NULL,
  display_text text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.product_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage product offers" ON public.product_offers FOR ALL USING (is_admin_or_staff(auth.uid())) WITH CHECK (is_admin_or_staff(auth.uid()));
CREATE POLICY "Public can read product offers" ON public.product_offers FOR SELECT USING (true);

-- Seed default delivery zones for Bangladesh
INSERT INTO public.delivery_zones (zone_name, areas, delivery_charge, free_delivery_minimum, estimated_days, sort_order) VALUES
('Inside Dhaka', 'Dhaka City, Mirpur, Uttara, Gulshan, Banani, Dhanmondi, Mohammadpur', 60, 1500, '1-2 days', 0),
('Outside Dhaka', 'All districts outside Dhaka', 120, 2000, '3-5 days', 1);
