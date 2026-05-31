INSERT INTO homepage_sections (id, sort_order, enabled, content) VALUES
  ('hero', 0, true, '{"headline":"Designed for modern carry.","subtext":"Minimal leather goods, crafted in Dhaka.","image":"/hero/aerom-hero-1.jpg","button1_text":"Shop now","button1_link":"/shop","button1_enabled":true,"button2_text":"Our story","button2_link":"/about","button2_enabled":true}'::jsonb),
  ('featured', 1, true, '{"section_title":"Featured","subtitle":"Quietly considered essentials"}'::jsonb),
  ('categories_showcase', 2, true, '{"section_title":"Shop by category","subtitle":"Browse the collection"}'::jsonb),
  ('bestsellers', 3, true, '{"section_title":"Best sellers","subtitle":"Loved by our customers"}'::jsonb),
  ('brand_story', 4, true, '{"title":"Crafted with intention","text":"Every AEROM piece is built to last — minimal leather goods made by hand in Dhaka.","image":"/about/aerom-craft.jpg","button_text":"Read our story","button_link":"/about"}'::jsonb),
  ('why_choose_us', 5, true, '{"section_title":"Why AEROM","subtitle":"Built on craft, not noise"}'::jsonb),
  ('testimonials', 6, true, '{"section_title":"What customers say","subtitle":""}'::jsonb),
  ('faq', 7, true, '{"section_title":"Frequently asked","subtitle":""}'::jsonb),
  ('newsletter', 8, true, '{"title":"Join the Atelier","subtext":"Receive new drops, first.","placeholder":"Enter your email","button_text":"Subscribe","footnote":"No spam — unsubscribe any time"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

UPDATE delivery_zones SET zone_name = name WHERE zone_name IS NULL OR zone_name = '';