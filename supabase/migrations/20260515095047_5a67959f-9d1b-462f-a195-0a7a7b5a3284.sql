-- 1) Remove the wide-open public SELECT on orders
DROP POLICY IF EXISTS "Public view orders" ON public.orders;

-- 2) Admin/staff can read all orders
DO $$ BEGIN
  EXECUTE 'CREATE POLICY "Staff view orders" ON public.orders FOR SELECT TO authenticated USING (is_admin_or_staff(auth.uid()))';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3) Public tracking via security-definer RPCs (return safe column subset only)
CREATE OR REPLACE FUNCTION public.track_order(_order_number text)
RETURNS TABLE (
  order_number text,
  order_status text,
  payment_status text,
  payment_method text,
  total numeric,
  subtotal numeric,
  shipping_cost numeric,
  discount_amount numeric,
  items jsonb,
  tracking_number text,
  delivery_partner text,
  customer_name text,
  customer_city text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT order_number, order_status, payment_status, payment_method,
         total, subtotal, shipping_cost, discount_amount, items,
         tracking_number, delivery_partner, customer_name, customer_city,
         created_at, updated_at
  FROM public.orders
  WHERE order_number = _order_number
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.track_orders_by_phone(_phone text)
RETURNS TABLE (
  order_number text,
  order_status text,
  payment_status text,
  payment_method text,
  total numeric,
  subtotal numeric,
  shipping_cost numeric,
  discount_amount numeric,
  items jsonb,
  tracking_number text,
  delivery_partner text,
  customer_name text,
  customer_city text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT order_number, order_status, payment_status, payment_method,
         total, subtotal, shipping_cost, discount_amount, items,
         tracking_number, delivery_partner, customer_name, customer_city,
         created_at, updated_at
  FROM public.orders
  WHERE customer_phone = _phone
  ORDER BY created_at DESC
  LIMIT 20;
$$;

GRANT EXECUTE ON FUNCTION public.track_order(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.track_orders_by_phone(text) TO anon, authenticated;