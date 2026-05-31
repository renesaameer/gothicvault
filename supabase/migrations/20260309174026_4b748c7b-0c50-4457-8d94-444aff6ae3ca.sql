
-- Create delivery_partners table for courier API integrations
CREATE TABLE public.delivery_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT false,
  api_base_url TEXT DEFAULT '',
  api_token TEXT DEFAULT '',
  store_id TEXT DEFAULT '',
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.delivery_partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage delivery partners" ON public.delivery_partners FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
