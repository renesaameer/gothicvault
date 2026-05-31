
ALTER TABLE public.homepage_sections 
  ADD COLUMN IF NOT EXISTS enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

-- Seed sort orders matching the homepage layout
UPDATE public.homepage_sections SET sort_order = CASE id
  WHEN 'hero' THEN 10
  WHEN 'featured' THEN 20
  WHEN 'bestsellers' THEN 30
  WHEN 'categories_showcase' THEN 40
  WHEN 'brands_showcase' THEN 50
  WHEN 'brand_story' THEN 60
  WHEN 'why_choose_us' THEN 70
  WHEN 'testimonials' THEN 80
  WHEN 'video_reels' THEN 85
  WHEN 'faq' THEN 90
  WHEN 'newsletter' THEN 100
  ELSE sort_order
END;

-- Ensure brand_story row exists and is enabled with populated content
INSERT INTO public.homepage_sections (id, title, content, enabled, sort_order)
VALUES ('brand_story', 'Story', jsonb_build_object(
  'title', 'The MaverickMist Story',
  'text', E'MaverickMist began with a quiet belief — that fragrance should feel personal, not performative. Founded in Bangladesh and crafted by a small team of perfumers, every bottle is hand-blended in limited batches using premium oils sourced from the historic perfume houses of France, the rose valleys of Bulgaria, and the oud markets of the Middle East.\n\nOur scents are built to linger like a memory — delicate florals at dawn, warm orientals at dusk, and clean, weightless freshness in between. Each composition is balanced for longevity, so a single spray carries you gracefully through the day.\n\nThis is luxury made quietly — a fragrance you wear for yourself first.',
  'image', '/perfume/hero.jpg',
  'button_text', 'Explore the Collection',
  'button_link', '/shop',
  'enabled', true
), true, 60)
ON CONFLICT (id) DO UPDATE SET enabled = true;
