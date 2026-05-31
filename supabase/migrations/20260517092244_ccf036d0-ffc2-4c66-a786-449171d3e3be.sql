
-- 1. Populate Featured + Best Sellers
UPDATE public.products SET featured = true, best_seller = true;

-- 2. Rename categories
UPDATE public.categories SET name='Wallets', slug='wallets' WHERE id='11111111-1111-1111-1111-111111111101';
UPDATE public.categories SET name='Cardholders', slug='cardholders' WHERE id='11111111-1111-1111-1111-111111111102';
UPDATE public.categories SET name='Belts', slug='belts' WHERE id='11111111-1111-1111-1111-111111111103';

-- 3. Reassign products to correct categories
UPDATE public.products SET category_id='11111111-1111-1111-1111-111111111101'
  WHERE id IN ('33333333-3333-3333-3333-333333333301','33333333-3333-3333-3333-333333333304');
UPDATE public.products SET category_id='11111111-1111-1111-1111-111111111102'
  WHERE id IN ('33333333-3333-3333-3333-333333333302','33333333-3333-3333-3333-333333333303','33333333-3333-3333-3333-333333333305');
UPDATE public.products SET category_id='11111111-1111-1111-1111-111111111103'
  WHERE id='33333333-3333-3333-3333-333333333306';

-- 4. About sections used by /about (header, story, mission_vision, founder, values, cta)
INSERT INTO public.about_sections (id, sort_order, enabled, content) VALUES
('header', 1, true, '{"title":"About AEROM","intro":"Designed for modern carry. Precision in every detail."}'::jsonb),
('story', 2, true, '{"headline":"The craft of carry.","image":"/about/aerom-story.jpg","text":"AEROM is a study in restraint. Full-grain leather, considered hardware, and the quiet patience of work done well.\n\nWe build pieces that disappear into your day and reappear, season after season, looking better than the day you bought them."}'::jsonb),
('mission_vision', 3, true, '{"mission":"To make essential carry — wallets, cardholders, belts — that feel inevitable. Minimal by intention. Built to last.","vision":"A future where less is desired more. Where what you carry is chosen, not collected."}'::jsonb),
('founder', 4, true, '{"headline":"A note from the founder","image":"/about/aerom-founder.jpg","message":"We started AEROM because the market was loud and the wallets were louder. We wanted something quieter — black leather, clean stitching, weight in the hand.\n\nEverything we ship is something we''d carry ourselves."}'::jsonb),
('values', 5, true, '{"cards":[
  {"icon":"Gem","title":"Full-grain only","description":"The top cut of the hide. Ages into character, never plastic."},
  {"icon":"Ruler","title":"Considered fit","description":"Sized for modern cards, modern pockets, modern hands."},
  {"icon":"Shield","title":"Built to last","description":"Edge-painted, hand-finished, stitched to outlive the trend cycle."},
  {"icon":"Leaf","title":"Quiet design","description":"No logos on the outside. The work speaks for itself."}
]}'::jsonb),
('cta', 6, true, '{"text":"Find your everyday carry.","button_text":"Shop the collection","button_link":"/shop"}'::jsonb)
ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, enabled = EXCLUDED.enabled, sort_order = EXCLUDED.sort_order;

-- 5. Remove the stray 'hero' about row that isn't rendered
DELETE FROM public.about_sections WHERE id = 'hero';
