
-- Function to restore product stock (for undo sale)
CREATE OR REPLACE FUNCTION public.increment_product_stock(_product_id uuid, _quantity integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE products SET stock = stock + _quantity WHERE id = _product_id;
END;
$$;

-- Function to decrement coupon usage (for undo sale)
CREATE OR REPLACE FUNCTION public.decrement_coupon_usage(_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE coupons SET used_count = GREATEST(0, used_count - 1) WHERE code = _code;
END;
$$;

-- Function to reverse customer stats (for undo sale)
CREATE OR REPLACE FUNCTION public.reverse_customer_order(_email text, _order_total numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE customers 
  SET order_count = GREATEST(0, order_count - 1),
      total_spent = GREATEST(0, total_spent - _order_total),
      updated_at = now()
  WHERE email = _email;
END;
$$;
