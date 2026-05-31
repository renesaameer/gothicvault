
-- Seed hero slides
INSERT INTO public.hero_slides (image_url, title, subtitle, button_text, button_link, sort_order, enabled)
VALUES
  ('https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1920&q=80', 'Step Into Style', 'Discover our latest collection of premium footwear', 'Shop Now', '/shop', 0, true),
  ('https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=1920&q=80', 'New Arrivals', 'Fresh styles just dropped — be the first to wear them', 'Explore', '/shop', 1, true),
  ('https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=1920&q=80', 'Summer Sale', 'Up to 40% off on selected styles', 'View Deals', '/shop', 2, true);

-- Seed brands
INSERT INTO public.brands (name, slug, enabled, sort_order)
VALUES
  ('Nike', 'nike', true, 0),
  ('Adidas', 'adidas', true, 1),
  ('Puma', 'puma', true, 2),
  ('New Balance', 'new-balance', true, 3)
ON CONFLICT DO NOTHING;
