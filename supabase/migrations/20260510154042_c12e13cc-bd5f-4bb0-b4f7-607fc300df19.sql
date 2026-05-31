
-- Extend hero_slides with cinematic editorial fields
ALTER TABLE public.hero_slides
  ADD COLUMN IF NOT EXISTS mobile_image_url text,
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS label text,
  ADD COLUMN IF NOT EXISTS text_color text NOT NULL DEFAULT '#ffffff',
  ADD COLUMN IF NOT EXISTS text_align text NOT NULL DEFAULT 'left',
  ADD COLUMN IF NOT EXISTS vertical_position text NOT NULL DEFAULT 'bottom',
  ADD COLUMN IF NOT EXISTS height text NOT NULL DEFAULT 'full',
  ADD COLUMN IF NOT EXISTS overlay_opacity numeric NOT NULL DEFAULT 0.35,
  ADD COLUMN IF NOT EXISTS focal_x numeric NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS focal_y numeric NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS cta2_text text,
  ADD COLUMN IF NOT EXISTS cta2_link text;

-- Featured categories editorial section
CREATE TABLE IF NOT EXISTS public.featured_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sort_order integer NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  title text NOT NULL,
  subtitle text,
  link text,
  desktop_image text,
  mobile_image text,
  text_color text NOT NULL DEFAULT '#ffffff',
  text_align text NOT NULL DEFAULT 'left',
  overlay_opacity numeric NOT NULL DEFAULT 0.15,
  focal_x numeric NOT NULL DEFAULT 50,
  focal_y numeric NOT NULL DEFAULT 50,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.featured_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read featured categories"
  ON public.featured_categories FOR SELECT
  USING (true);

CREATE POLICY "Admin/staff can manage featured categories"
  ON public.featured_categories FOR ALL
  USING (public.is_admin_or_staff(auth.uid()))
  WITH CHECK (public.is_admin_or_staff(auth.uid()));

CREATE TRIGGER update_featured_categories_updated_at
  BEFORE UPDATE ON public.featured_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed 3 demo featured categories
INSERT INTO public.featured_categories (sort_order, title, subtitle, link, desktop_image, mobile_image)
VALUES
  (0, 'T-shirts', 'Spring''26', '/shop?category=t-shirts', 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=1200&q=80', 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80'),
  (1, 'Bottoms', 'Denim edit', '/shop?category=bottoms', 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=1200&q=80', 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80'),
  (2, 'Shirts', 'Layering essentials', '/shop?category=shirts', 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=1200&q=80', 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=80')
ON CONFLICT DO NOTHING;

-- Slider settings on homepage_sections.hero
UPDATE public.homepage_sections
SET content = COALESCE(content, '{}'::jsonb) || jsonb_build_object(
  'autoplay', COALESCE(content->>'autoplay', 'true')::boolean,
  'autoplay_speed', COALESCE((content->>'autoplay_speed')::int, 6000)
)
WHERE id = 'hero';
