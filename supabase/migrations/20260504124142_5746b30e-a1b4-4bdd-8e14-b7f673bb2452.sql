INSERT INTO public.homepage_sections (id, enabled, sort_order, content) VALUES
('hero', true, 1, '{"headline":"Elegant Modest Fashion for Every Occasion","subtext":"Discover abayas, khimars and curated sets crafted for everyday grace.","button1_text":"Shop Now","button1_link":"/products","button1_enabled":true,"button2_text":"","button2_link":"","button2_enabled":false,"image":""}'::jsonb),
('featured', true, 2, '{"section_title":"Featured Collection","subtitle":""}'::jsonb),
('categories_showcase', true, 3, '{"section_title":"Shop by Category","subtitle":""}'::jsonb),
('bestsellers', true, 4, '{"section_title":"Best Sellers","subtitle":""}'::jsonb),
('brand_story', true, 5, '{"title":"Our Story","text":"Crafted with care, designed for the modern modest woman.","image":"","button_text":"Learn More","button_link":"/about"}'::jsonb),
('brands_showcase', false, 6, '{"section_title":"Our Brands","subtitle":""}'::jsonb),
('why_choose_us', true, 7, '{}'::jsonb),
('testimonials', true, 8, '{}'::jsonb),
('faq', true, 9, '{}'::jsonb),
('newsletter', true, 10, '{"headline":"Join our community","subtext":"Get updates on new arrivals and exclusive offers.","background_image":""}'::jsonb)
ON CONFLICT (id) DO NOTHING;