
-- Create delivery_partners table for courier API integrations
CREATE TABLE public.delivery_partners (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT false,
  api_base_url text NOT NULL DEFAULT '',
  api_token text DEFAULT '',
  store_id text DEFAULT '',
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.delivery_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage delivery partners"
ON public.delivery_partners FOR ALL
USING (is_admin_or_staff(auth.uid()))
WITH CHECK (is_admin_or_staff(auth.uid()));

-- Insert Pathao as default delivery partner
INSERT INTO public.delivery_partners (name, slug, api_base_url, config) VALUES
('Pathao Courier', 'pathao', 'https://api-hermes.pathao.com', '{"delivery_type": 48, "item_type": 2}'::jsonb);
