
-- Extend incomplete_orders with recovery tracking
ALTER TABLE public.incomplete_orders
  ADD COLUMN IF NOT EXISTS recovered_by uuid,
  ADD COLUMN IF NOT EXISTS recovered_at timestamptz,
  ADD COLUMN IF NOT EXISTS contact_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS recovery_notes text;

CREATE INDEX IF NOT EXISTS idx_incomplete_orders_recovery_status
  ON public.incomplete_orders (recovery_status, last_activity DESC);

-- Recover an incomplete cart into a real order
CREATE OR REPLACE FUNCTION public.recover_incomplete_order(
  _incomplete_id uuid,
  _payload jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _ic public.incomplete_orders%ROWTYPE;
  _order_id uuid;
  _order_number text;
  _existing_order public.orders%ROWTYPE;
  _items jsonb;
  _item jsonb;
  _customer_name text;
  _customer_phone text;
  _customer_email text;
  _customer_address text;
  _customer_city text;
  _shipping_address jsonb;
  _subtotal numeric;
  _discount numeric;
  _shipping_cost numeric;
  _total numeric;
  _payment_method text;
  _coupon text;
  _notes text;
BEGIN
  IF NOT public.is_admin_or_staff(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT * INTO _ic FROM public.incomplete_orders WHERE id = _incomplete_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'incomplete order not found';
  END IF;

  -- Idempotent: if already recovered, return the existing order
  IF _ic.recovered = true AND _ic.converted_order_id IS NOT NULL THEN
    SELECT * INTO _existing_order FROM public.orders WHERE id = _ic.converted_order_id;
    RETURN jsonb_build_object(
      'order_id', _existing_order.id,
      'order_number', _existing_order.order_number,
      'already_recovered', true
    );
  END IF;

  -- Merge payload over cart defaults
  _items            := COALESCE(_payload->'items',           to_jsonb(_ic.cart_items));
  _customer_name    := COALESCE(NULLIF(_payload->>'customer_name', ''),    _ic.customer_name, '');
  _customer_phone   := COALESCE(NULLIF(_payload->>'customer_phone', ''),   _ic.phone);
  _customer_email   := NULLIF(COALESCE(_payload->>'customer_email', _ic.email, ''), '');
  _shipping_address := COALESCE(_payload->'shipping_address', _ic.address, '{}'::jsonb);
  _customer_address := COALESCE(
    NULLIF(_payload->>'customer_address', ''),
    NULLIF(_shipping_address->>'line1', ''),
    NULLIF(_shipping_address->>'address', ''),
    ''
  );
  _customer_city    := COALESCE(NULLIF(_payload->>'customer_city', ''), _shipping_address->>'city');
  _subtotal         := COALESCE((_payload->>'subtotal')::numeric,        _ic.subtotal,        0);
  _discount         := COALESCE((_payload->>'discount_amount')::numeric, 0);
  _shipping_cost    := COALESCE((_payload->>'shipping_cost')::numeric,   _ic.delivery_charge, 0);
  _total            := COALESCE((_payload->>'total')::numeric,           GREATEST(_subtotal + _shipping_cost - _discount, 0));
  _payment_method   := COALESCE(NULLIF(_payload->>'payment_method', ''), _ic.payment_method, 'cod');
  _coupon           := COALESCE(NULLIF(_payload->>'coupon_code', ''),    _ic.coupon);
  _notes := trim(both E'\n' from concat_ws(E'\n',
    'Recovered from incomplete cart',
    NULLIF(_payload->>'recovery_notes', '')
  ));

  _order_number := 'SP-' || to_char(now(),'YYMMDD') || '-' || lpad(((extract(epoch from now())*1000)::bigint % 100000)::text, 5, '0');

  INSERT INTO public.orders (
    order_number, customer_name, customer_phone, customer_email,
    customer_address, customer_city, shipping_address,
    items, subtotal, shipping_cost, discount_amount, total,
    payment_method, payment_status, order_status, coupon_code, notes
  ) VALUES (
    _order_number, _customer_name, _customer_phone, _customer_email,
    _customer_address, _customer_city, _shipping_address,
    _items, _subtotal, _shipping_cost, _discount, _total,
    _payment_method, 'pending', 'pending', _coupon, _notes
  )
  RETURNING id INTO _order_id;

  -- Decrement product stock for each item that has a product_id
  FOR _item IN SELECT * FROM jsonb_array_elements(_items)
  LOOP
    IF (_item ? 'product_id') AND NULLIF(_item->>'product_id','') IS NOT NULL THEN
      PERFORM public.decrement_product_stock(
        (_item->>'product_id')::uuid,
        COALESCE((_item->>'quantity')::int, 1)
      );
    END IF;
  END LOOP;

  -- Mark incomplete as recovered
  UPDATE public.incomplete_orders
     SET recovered = true,
         recovery_status = 'recovered',
         converted_order_id = _order_id,
         recovered_by = auth.uid(),
         recovered_at = now(),
         last_activity = now(),
         recovery_notes = COALESCE(NULLIF(_payload->>'recovery_notes', ''), recovery_notes)
   WHERE id = _incomplete_id;

  -- Update customer aggregate (best effort, ignore on conflict)
  BEGIN
    PERFORM public.upsert_checkout_customer(
      _customer_name, _customer_email, _customer_phone, _total, _customer_address, _customer_city
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN jsonb_build_object(
    'order_id', _order_id,
    'order_number', _order_number,
    'already_recovered', false
  );
END $$;

-- Bulk: mark contacted
CREATE OR REPLACE FUNCTION public.bulk_mark_incomplete_contacted(_ids uuid[])
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _n integer;
BEGIN
  IF NOT public.is_admin_or_staff(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  UPDATE public.incomplete_orders
     SET recovery_status = 'contacted',
         contact_attempts = contact_attempts + 1,
         last_activity = now()
   WHERE id = ANY(_ids)
     AND recovered = false;
  GET DIAGNOSTICS _n = ROW_COUNT;
  RETURN _n;
END $$;

-- Bulk: delete
CREATE OR REPLACE FUNCTION public.bulk_delete_incomplete(_ids uuid[])
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _n integer;
BEGIN
  IF NOT public.is_admin_or_staff(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  DELETE FROM public.incomplete_orders WHERE id = ANY(_ids);
  GET DIAGNOSTICS _n = ROW_COUNT;
  RETURN _n;
END $$;

-- Update incomplete cart (admin edit, no phone gate)
CREATE OR REPLACE FUNCTION public.admin_update_incomplete_order(
  _id uuid,
  _payload jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin_or_staff(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  UPDATE public.incomplete_orders
     SET customer_name   = COALESCE(NULLIF(_payload->>'customer_name', ''), customer_name),
         email           = COALESCE(_payload->>'email', email),
         phone           = COALESCE(NULLIF(_payload->>'phone', ''), phone),
         address         = COALESCE(_payload->'address', address),
         cart_items      = COALESCE(_payload->'cart_items', cart_items),
         subtotal        = COALESCE((_payload->>'subtotal')::numeric, subtotal),
         delivery_charge = COALESCE((_payload->>'delivery_charge')::numeric, delivery_charge),
         total           = COALESCE((_payload->>'total')::numeric, total),
         coupon          = COALESCE(_payload->>'coupon', coupon),
         payment_method  = COALESCE(_payload->>'payment_method', payment_method),
         recovery_notes  = COALESCE(_payload->>'recovery_notes', recovery_notes),
         last_activity   = now()
   WHERE id = _id;
END $$;
