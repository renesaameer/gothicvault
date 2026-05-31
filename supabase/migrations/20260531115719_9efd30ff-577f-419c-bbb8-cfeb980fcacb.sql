INSERT INTO public.homepage_sections (id, sort_order, enabled, content)
SELECT 'featured_image', 85, true,
  '{"section_title":"","subtitle":"","image":"","button_text":"Shop now","button_link":"/shop","overlay":true}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.homepage_sections WHERE id = 'featured_image');