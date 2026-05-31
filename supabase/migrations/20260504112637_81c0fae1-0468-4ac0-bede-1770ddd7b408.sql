-- Migration 5: Column aliases and additions to match frontend code

ALTER TABLE public.delivery_zones
  ADD COLUMN IF NOT EXISTS zone_name text,
  ADD COLUMN IF NOT EXISTS areas jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS delivery_charge numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS free_delivery_minimum numeric,
  ADD COLUMN IF NOT EXISTS estimated_days text;

ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS min_order_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_address jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.tracking_pixels
  ADD COLUMN IF NOT EXISTS advanced_matching boolean NOT NULL DEFAULT true;

ALTER TABLE public.contact_submissions
  ADD COLUMN IF NOT EXISTS read boolean NOT NULL DEFAULT false;

-- Update upsert_checkout_customer to make address/city optional
DROP FUNCTION IF EXISTS public.upsert_checkout_customer(text,text,text,text,text,numeric);

CREATE OR REPLACE FUNCTION public.upsert_checkout_customer(
  _name text,
  _email text DEFAULT NULL,
  _phone text DEFAULT '',
  _order_total numeric DEFAULT 0,
  _address text DEFAULT NULL,
  _city text DEFAULT NULL
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE existing_id uuid;
BEGIN
  SELECT id INTO existing_id FROM public.customers
   WHERE (NULLIF(_phone,'') IS NOT NULL AND phone = _phone)
      OR (NULLIF(_email,'') IS NOT NULL AND email = _email)
   LIMIT 1;
  IF existing_id IS NULL THEN
    INSERT INTO public.customers (name, email, phone, address, city, total_orders, total_spent)
    VALUES (_name, _email, COALESCE(_phone,''), _address, _city, 1, COALESCE(_order_total,0));
  ELSE
    UPDATE public.customers SET
      name = COALESCE(NULLIF(_name,''), name),
      email = COALESCE(NULLIF(_email,''), email),
      address = COALESCE(NULLIF(_address,''), address),
      city = COALESCE(NULLIF(_city,''), city),
      total_orders = total_orders + 1,
      total_spent = total_spent + COALESCE(_order_total,0),
      updated_at = now()
    WHERE id = existing_id;
  END IF;
END$$;
GRANT EXECUTE ON FUNCTION public.upsert_checkout_customer(text,text,text,numeric,text,text) TO anon, authenticated;