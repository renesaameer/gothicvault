
CREATE TABLE public.video_testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_url text NOT NULL,
  thumbnail_url text,
  title text,
  subtitle text,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  cta_text text DEFAULT 'Shop Now',
  cta_enabled boolean NOT NULL DEFAULT true,
  enabled boolean NOT NULL DEFAULT true,
  featured boolean NOT NULL DEFAULT false,
  autoplay boolean NOT NULL DEFAULT true,
  muted boolean NOT NULL DEFAULT true,
  loop boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.video_testimonials TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.video_testimonials TO authenticated;
GRANT ALL ON public.video_testimonials TO service_role;

ALTER TABLE public.video_testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pub_view" ON public.video_testimonials
  FOR SELECT TO public USING (enabled = true);

CREATE POLICY "admins_manage" ON public.video_testimonials
  FOR ALL TO authenticated
  USING (public.is_admin_or_staff(auth.uid()))
  WITH CHECK (public.is_admin_or_staff(auth.uid()));

CREATE TRIGGER trg_video_testimonials_updated
  BEFORE UPDATE ON public.video_testimonials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed the homepage section toggle entry
INSERT INTO public.homepage_sections (id, enabled, sort_order, content)
VALUES ('video_reels', true, 75, '{"section_title":"Real Customer Experiences","subtitle":"See how our community experiences the collection."}'::jsonb)
ON CONFLICT (id) DO NOTHING;
