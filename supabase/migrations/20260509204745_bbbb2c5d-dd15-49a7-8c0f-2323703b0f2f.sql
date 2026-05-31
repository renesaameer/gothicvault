CREATE OR REPLACE FUNCTION public.subscribe_newsletter(_email text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.newsletter_subscribers (email) VALUES (_email) ON CONFLICT (email) DO NOTHING;
END;
$$;

CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  option_values jsonb NOT NULL DEFAULT '{}',
  price numeric(10,2) NOT NULL DEFAULT 0,
  sale_price numeric(10,2),
  stock int NOT NULL DEFAULT 0,
  sku text DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS product_variants_product_id_idx ON public.product_variants(product_id);
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read product variants" ON public.product_variants;
CREATE POLICY "Public can read product variants" ON public.product_variants FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin/staff can manage product variants" ON public.product_variants;
CREATE POLICY "Admin/staff can manage product variants" ON public.product_variants FOR ALL TO authenticated
  USING (public.is_admin_or_staff(auth.uid())) WITH CHECK (public.is_admin_or_staff(auth.uid()));
DROP TRIGGER IF EXISTS update_product_variants_updated_at ON public.product_variants;
CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS option_groups jsonb NOT NULL DEFAULT '[]';

CREATE TABLE IF NOT EXISTS public.floating_icons_settings (
  id text PRIMARY KEY DEFAULT 'default',
  enabled boolean NOT NULL DEFAULT true,
  radar_animation boolean NOT NULL DEFAULT true,
  expand_icon_url text DEFAULT '',
  animation_style text NOT NULL DEFAULT 'radar',
  animation_intensity text NOT NULL DEFAULT 'med',
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.floating_icons_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read floating icons settings" ON public.floating_icons_settings;
CREATE POLICY "Public can read floating icons settings" ON public.floating_icons_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin can manage floating icons settings" ON public.floating_icons_settings;
CREATE POLICY "Admin can manage floating icons settings" ON public.floating_icons_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.floating_icons_settings (id) VALUES ('default') ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.floating_icons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  url text NOT NULL,
  icon_url text DEFAULT '',
  bg_color text NOT NULL DEFAULT '#25D366',
  icon_color text NOT NULL DEFAULT '#ffffff',
  preset_key text,
  enabled boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS floating_icons_sort_idx ON public.floating_icons(sort_order);
ALTER TABLE public.floating_icons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read enabled floating icons" ON public.floating_icons;
CREATE POLICY "Public can read enabled floating icons" ON public.floating_icons FOR SELECT USING (enabled = true);
DROP POLICY IF EXISTS "Admin can manage floating icons" ON public.floating_icons;
CREATE POLICY "Admin can manage floating icons" ON public.floating_icons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.shop_settings
  ADD COLUMN IF NOT EXISTS card_show_view_details boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS card_show_add_to_cart boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS card_show_buy_now boolean NOT NULL DEFAULT true;

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
DROP POLICY IF EXISTS "Public can read direct order channels" ON public.direct_order_channels;
CREATE POLICY "Public can read direct order channels" ON public.direct_order_channels FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Admin can manage direct order channels" ON public.direct_order_channels;
CREATE POLICY "Admin can manage direct order channels" ON public.direct_order_channels FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
DROP TRIGGER IF EXISTS update_direct_order_channels_updated_at ON public.direct_order_channels;
CREATE TRIGGER update_direct_order_channels_updated_at BEFORE UPDATE ON public.direct_order_channels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.direct_order_channels (id, enabled, label, identifier, message_template, sort_order) VALUES
  ('whatsapp', false, 'Order via WhatsApp', '', 'I want to order: {product_name} {product_url}', 0),
  ('messenger', false, 'Order via Messenger', '', '{product_url}', 1)
ON CONFLICT (id) DO NOTHING;

REVOKE EXECUTE ON FUNCTION public.subscribe_newsletter(text) FROM public, anon;