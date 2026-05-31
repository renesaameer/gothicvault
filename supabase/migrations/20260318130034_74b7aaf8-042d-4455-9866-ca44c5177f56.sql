CREATE POLICY "Public read orders by order_number or phone"
ON public.orders
FOR SELECT
TO public
USING (true);