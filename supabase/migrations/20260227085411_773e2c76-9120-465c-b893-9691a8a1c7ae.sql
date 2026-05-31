
-- Allow anyone to read orders by order_number (for tracking)
CREATE POLICY "Anyone can track orders by number" ON public.orders FOR SELECT USING (true);
