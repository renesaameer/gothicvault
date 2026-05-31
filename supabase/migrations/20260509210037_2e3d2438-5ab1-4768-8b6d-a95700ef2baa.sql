-- 1) Categories: add image column + set imagery
ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url text;

UPDATE categories SET image_url = CASE slug
  WHEN 'side-bags'   THEN 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=1200&q=80'
  WHEN 'chest-bags'  THEN 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=1200&q=80'
  WHEN 'clutch-bags' THEN 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=1200&q=80'
  WHEN 'duffel-bags' THEN 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200&q=80'
  ELSE image_url
END
WHERE slug IN ('side-bags','chest-bags','clutch-bags','duffel-bags');

-- 2) Homepage sections — clear and reseed with the IDs the page actually consumes
DELETE FROM homepage_sections WHERE id IN (
  'hero','featured','categories','best_sellers','bestsellers','categories_showcase',
  'promo_banner','new_arrivals','why_choose_us','testimonials','faqs','faq','newsletter',
  'brand_story','brands_showcase'
);

INSERT INTO homepage_sections (id, title, enabled, sort_order, content) VALUES
  ('hero','Hero',true,1,'{}'::jsonb),
  ('featured','Featured Collection',true,2,'{"section_title":"Featured Collection","subtitle":"Pieces selected by our atelier"}'::jsonb),
  ('categories_showcase','Shop by Category',true,3,'{"section_title":"Shop by Category","subtitle":"Crafted for every occasion"}'::jsonb),
  ('bestsellers','Best Sellers',true,4,'{"section_title":"Best Sellers","subtitle":"Loved by our community"}'::jsonb),
  ('brand_story','Our Story',true,5,'{"title":"Our Story","text":"RAREFINDS. was founded on a simple belief — that the most beautiful objects are the ones built to outlast trend. Each piece is hand-finished in our atelier from vegetable-tanned full-grain leather sourced in Tuscany. Quiet, considered, and made to age beautifully.","image":"https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=1600&q=85","button_text":"Read our story","button_link":"/about"}'::jsonb),
  ('brands_showcase','Our Brands',true,6,'{"section_title":"Our Brands","subtitle":"Heritage workshops we partner with"}'::jsonb),
  ('why_choose_us','The RAREFINDS Standard',true,7,'{"section_title":"The RAREFINDS Standard","subtitle":"Why collectors choose us"}'::jsonb),
  ('testimonials','From Our Community',true,8,'{"section_title":"From Our Community","subtitle":"Words from clients across Bangladesh"}'::jsonb),
  ('faq','Considered Questions',true,9,'{"section_title":"Considered Questions","subtitle":"Everything you need to know"}'::jsonb),
  ('newsletter','Join the Atelier',true,10,'{"title":"Join the Atelier","subtitle":"Early access to new collections, private events, and the occasional letter from our founder."}'::jsonb);

-- 3) About sections — reseed with the IDs the About page consumes
DELETE FROM about_sections WHERE id IN ('hero','header','story','mission_vision','mission','craft','founder','values','cta');

INSERT INTO about_sections (id, title, enabled, sort_order, content) VALUES
  ('header','Header',true,1,'{"title":"About RAREFINDS.","intro":"Crafted leather goods for collectors of quiet luxury — designed in Dhaka, finished by hand in heritage Italian ateliers."}'::jsonb),
  ('story','Story',true,2,'{"headline":"Our Story","image":"https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=1600&q=85","text":"RAREFINDS. began with a single carry-all stitched in a small workshop in Florence — a piece designed to outlast trend, soften with use, and travel with its owner for decades.\n\nToday we work with two heritage tanneries in Tuscany, selecting only vegetable-tanned full-grain leather that ages with character. Every silhouette is studied for years before release. Every edge is hand-burnished. Every stitch is hand-checked."}'::jsonb),
  ('mission_vision','Mission & Vision',true,3,'{"mission":"To design fewer pieces, made better — leather goods you keep, repair, and pass on, rather than replace.","vision":"A quieter kind of luxury, defined by craft and longevity rather than logos."}'::jsonb),
  ('founder','Founder',true,4,'{"headline":"From the Founder","image":"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&q=85","message":"I started RAREFINDS. because I could not find a leather bag I wanted to keep for life. Every piece you see here is one I would carry myself — and many of them, I do.\n\nThank you for considering us.\n\n— Nupur, Founder"}'::jsonb),
  ('values','Values',true,5,'{"cards":[{"icon":"Shield","title":"Full-Grain Only","description":"Vegetable-tanned leather from heritage Italian tanneries."},{"icon":"Sparkles","title":"Hand-Finished","description":"Every edge burnished, every stitch hand-checked in our atelier."},{"icon":"Heart","title":"Lifetime Repair","description":"Complimentary conditioning and lifetime hardware repair."},{"icon":"Truck","title":"Considered Shipping","description":"Carbon-conscious courier across Bangladesh."}]}'::jsonb),
  ('cta','CTA',true,6,'{"text":"Find your next heirloom piece.","button_text":"Shop the collection","button_link":"/shop"}'::jsonb);