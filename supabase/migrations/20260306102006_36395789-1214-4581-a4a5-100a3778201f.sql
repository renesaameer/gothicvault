
CREATE TABLE public.tracking_pixels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  pixel_id text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.tracking_pixels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage tracking pixels" ON public.tracking_pixels FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can read tracking pixels" ON public.tracking_pixels FOR SELECT TO anon, authenticated
  USING (true);

-- Seed default platforms
INSERT INTO public.tracking_pixels (platform, pixel_id, enabled) VALUES
  ('facebook', '', false),
  ('google_analytics', '', false),
  ('tiktok', '', false);
