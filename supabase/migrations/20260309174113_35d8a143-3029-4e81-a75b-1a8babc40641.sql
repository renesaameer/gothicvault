
-- Create landing_pages table
CREATE TABLE public.landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  sections JSONB DEFAULT '[]',
  theme JSONB DEFAULT '{}',
  enabled BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read enabled landing pages" ON public.landing_pages FOR SELECT USING (true);
CREATE POLICY "Admins manage landing pages" ON public.landing_pages FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Create landing_page_events table for analytics
CREATE TABLE public.landing_page_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_page_id UUID REFERENCES public.landing_pages(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL DEFAULT 'view',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.landing_page_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert events" ON public.landing_page_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins read events" ON public.landing_page_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
