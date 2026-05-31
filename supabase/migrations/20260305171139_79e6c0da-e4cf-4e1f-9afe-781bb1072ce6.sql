
-- Add image_url to categories for category showcase on homepage
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS image_url text DEFAULT NULL;

-- Add homepage sections for categories and brands showcase
INSERT INTO public.homepage_sections (id, title, sort_order, enabled, content)
VALUES 
  ('categories_showcase', 'Shop by Category', 35, true, '{"section_title": "Shop by Category", "subtitle": "Browse our collections"}'::jsonb),
  ('brands_showcase', 'Our Brands', 36, true, '{"section_title": "Our Brands", "subtitle": "Trusted brands we carry"}'::jsonb)
ON CONFLICT (id) DO NOTHING;
