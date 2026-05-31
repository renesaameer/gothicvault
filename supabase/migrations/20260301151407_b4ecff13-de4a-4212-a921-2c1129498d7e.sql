
-- RPC: Increment coupon usage (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.increment_coupon_usage(_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE coupons SET used_count = used_count + 1 WHERE code = _code;
END;
$$;

-- RPC: Upsert customer from guest checkout (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.upsert_checkout_customer(
  _name text,
  _email text,
  _phone text,
  _order_total numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO customers (name, email, phone, order_count, total_spent)
  VALUES (_name, _email, _phone, 1, _order_total)
  ON CONFLICT (email) DO UPDATE SET
    order_count = customers.order_count + 1,
    total_spent = customers.total_spent + _order_total,
    name = _name,
    phone = COALESCE(_phone, customers.phone),
    updated_at = now();
END;
$$;

-- Add unique constraint on customers.email for ON CONFLICT to work
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'customers_email_key'
  ) THEN
    ALTER TABLE public.customers ADD CONSTRAINT customers_email_key UNIQUE (email);
  END IF;
END;
$$;

-- RPC: Decrement stock after order
CREATE OR REPLACE FUNCTION public.decrement_product_stock(_product_id uuid, _quantity int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE products SET stock = GREATEST(0, stock - _quantity) WHERE id = _product_id;
END;
$$;
