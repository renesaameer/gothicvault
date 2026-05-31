-- 1. Global card button toggles in shop_settings
ALTER TABLE public.shop_settings
  ADD COLUMN IF NOT EXISTS card_show_view_details boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS card_show_add_to_cart boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS card_show_buy_now boolean NOT NULL DEFAULT true;

-- 2. Direct order channels (WhatsApp / Messenger / extensible)
CREATE TABLE IF NOT EXISTS public.direct_order_channels (
  id text NOT NULL PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT false,
  label text NOT NULL DEFAULT '',
  identifier text NOT NULL DEFAULT '',
  message_template text NOT NULL DEFAULT 'I want to order: {product_name} {product_url}',
  sort_order integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.direct_order_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read direct order channels"
  ON public.direct_order_channels FOR SELECT
  TO public USING (true);

CREATE POLICY "Admin can manage direct order channels"
  ON public.direct_order_channels FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_direct_order_channels_updated_at
  BEFORE UPDATE ON public.direct_order_channels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed defaults
INSERT INTO public.direct_order_channels (id, enabled, label, identifier, message_template, sort_order)
VALUES
  ('whatsapp', false, 'Order via WhatsApp', '', 'I want to order: {product_name} {product_url}', 0),
  ('messenger', false, 'Order via Messenger', '', '{product_url}', 1)
ON CONFLICT (id) DO NOTHING;