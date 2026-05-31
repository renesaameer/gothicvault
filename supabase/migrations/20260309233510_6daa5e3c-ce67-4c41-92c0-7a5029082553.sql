
-- Insert Categories
INSERT INTO public.categories (id, name, slug, sort_order, image_url) VALUES
  ('a1b2c3d4-0001-4000-8000-000000000001', 'Tote Bags', 'tote-bags', 1, 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&h=600&fit=crop'),
  ('a1b2c3d4-0001-4000-8000-000000000002', 'Crossbody Bags', 'crossbody-bags', 2, 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800&h=600&fit=crop'),
  ('a1b2c3d4-0001-4000-8000-000000000003', 'Clutches', 'clutches', 3, 'https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=800&h=600&fit=crop'),
  ('a1b2c3d4-0001-4000-8000-000000000004', 'Handbags', 'handbags', 4, 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&h=600&fit=crop'),
  ('a1b2c3d4-0001-4000-8000-000000000005', 'Sling Bags', 'sling-bags', 5, 'https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?w=800&h=600&fit=crop'),
  ('a1b2c3d4-0001-4000-8000-000000000006', 'Bucket Bags', 'bucket-bags', 6, 'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=800&h=600&fit=crop')
ON CONFLICT (id) DO NOTHING;

-- Insert Products
INSERT INTO public.products (name, slug, price, sale_price, images, category_id, stock, rating, review_count, featured, best_seller, short_description, description, sku, variants) VALUES
  ('Royal Quilted Tote Bag', 'royal-quilted-tote-bag', 4500, 3800, 
   ARRAY['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&h=600&fit=crop','https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600&h=600&fit=crop'],
   'a1b2c3d4-0001-4000-8000-000000000001', 25, 4.9, 87, true, true,
   'Elegant quilted tote with gold-tone hardware and premium leather finish.',
   'Our Royal Quilted Tote is crafted from premium faux leather with meticulous quilted stitching. Featuring gold-tone chain accents, a spacious interior with zip pocket, and magnetic snap closure. Perfect for work and weekend outings.',
   'SS-TT-001', '[{"type":"Color","options":["Black","Cream","Burgundy"]}]'::jsonb),

  ('Elegance Chain Crossbody', 'elegance-chain-crossbody', 3200, NULL,
   ARRAY['https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=600&h=600&fit=crop'],
   'a1b2c3d4-0001-4000-8000-000000000002', 30, 4.7, 64, true, false,
   'Chic crossbody with detachable gold chain strap.',
   'A statement piece for every occasion. The Elegance Chain Crossbody features a sleek silhouette with a detachable gold chain strap, interior card slots, and premium lining.',
   'SS-CB-002', NULL),

  ('Luxe Evening Clutch', 'luxe-evening-clutch', 2800, NULL,
   ARRAY['https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=600&h=600&fit=crop'],
   'a1b2c3d4-0001-4000-8000-000000000003', 40, 4.8, 52, true, true,
   'Sparkling evening clutch perfect for special occasions.',
   'Make a grand entrance with our Luxe Evening Clutch. Adorned with subtle metallic accents and a satin-lined interior. Includes a detachable wrist strap and hidden magnetic closure.',
   'SS-CL-003', '[{"type":"Color","options":["Gold","Silver","Rose Gold"]}]'::jsonb),

  ('Classic Leather Handbag', 'classic-leather-handbag', 5500, 4800,
   ARRAY['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&h=600&fit=crop'],
   'a1b2c3d4-0001-4000-8000-000000000004', 15, 4.9, 118, true, true,
   'Timeless structured handbag in rich leather finish.',
   'The Classic Leather Handbag is the epitome of sophistication. Structured silhouette, premium hardware, and a versatile design that transitions from day to night effortlessly.',
   'SS-HB-004', '[{"type":"Color","options":["Black","Tan","Navy"]}]'::jsonb),

  ('Mini Sling Bag', 'mini-sling-bag', 1800, NULL,
   ARRAY['https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?w=600&h=600&fit=crop'],
   'a1b2c3d4-0001-4000-8000-000000000005', 60, 4.5, 95, false, true,
   'Compact and trendy mini sling for everyday outings.',
   'Small but mighty — our Mini Sling Bag carries your phone, cards, and keys in style. Adjustable strap, zip closure, and available in multiple fun colors.',
   'SS-SL-005', '[{"type":"Color","options":["Black","Tan","Blush Pink","Olive"]}]'::jsonb),

  ('Woven Bucket Bag', 'woven-bucket-bag', 3800, NULL,
   ARRAY['https://images.unsplash.com/photo-1591561954557-26941169b49e?w=600&h=600&fit=crop'],
   'a1b2c3d4-0001-4000-8000-000000000006', 22, 4.6, 38, false, false,
   'Artisan-inspired woven bucket bag with drawstring closure.',
   'A bohemian-meets-luxury piece. Our Woven Bucket Bag features intricate woven detailing, a roomy interior, and an adjustable crossbody strap.',
   'SS-BB-006', NULL),

  ('Executive Laptop Tote', 'executive-laptop-tote', 5200, NULL,
   ARRAY['https://images.unsplash.com/photo-1614179689702-355944cd0918?w=600&h=600&fit=crop'],
   'a1b2c3d4-0001-4000-8000-000000000001', 18, 4.8, 76, true, true,
   'Professional tote designed for the working woman.',
   'Power-dress your accessories. The Executive Laptop Tote fits up to a 15-inch laptop with padded compartment, multiple organizer pockets, and a detachable shoulder strap.',
   'SS-LT-007', '[{"type":"Color","options":["Black","Charcoal","Camel"]}]'::jsonb),

  ('Pearl Handle Party Bag', 'pearl-handle-party-bag', 3500, 2990,
   ARRAY['https://images.unsplash.com/photo-1612902456551-404b5b8e9c8f?w=600&h=600&fit=crop'],
   'a1b2c3d4-0001-4000-8000-000000000003', 35, 4.4, 45, false, false,
   'Statement party bag with faux pearl handle.',
   'Turn heads at every event with this show-stopping party bag. Features a gorgeous faux pearl handle, velvet-lined interior, and optional chain strap for crossbody wear.',
   'SS-PB-008', '[{"type":"Color","options":["Black","White","Blush"]}]'::jsonb);

-- Insert Testimonials
INSERT INTO public.testimonials (name, review, rating, image_url, sort_order) VALUES
  ('Fariha A.', 'The Royal Quilted Tote is absolutely stunning! The quality is unbelievable for the price. Got so many compliments at work.', 5, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop', 1),
  ('Nusrat J.', 'Ordered the Elegance Chain Crossbody and it arrived beautifully packaged. Feels so premium — my new favourite bag!', 5, 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop', 2),
  ('Tasnim R.', 'Step & Style has the best collection in Bangladesh. The bags look exactly like the photos. Will definitely order again!', 4, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop', 3),
  ('Sumaiya K.', 'I''ve been searching for affordable luxury bags and finally found Step & Style. The Executive Laptop Tote is perfect for office.', 5, NULL, 4);

-- Insert Home FAQs
INSERT INTO public.home_faqs (question, answer, sort_order) VALUES
  ('Are the bags made of genuine leather?', 'We offer both premium faux leather and genuine leather options. Each product description clearly mentions the material used.', 1),
  ('Do you deliver all over Bangladesh?', 'Yes! We deliver nationwide across Bangladesh. Dhaka deliveries take 1-2 business days, and outside Dhaka takes 3-5 business days.', 2),
  ('What is your return & exchange policy?', 'We offer a 7-day easy return & exchange policy. If the product is damaged or doesn''t match the description, we''ll arrange a free return.', 3),
  ('Can I see the bag before purchasing?', 'We regularly post detailed photos and videos on our Facebook and Instagram pages. For Dhaka customers, you can also visit our showroom by appointment.', 4),
  ('Do you offer gift wrapping?', 'Yes! We offer complimentary premium gift wrapping on all orders. Simply mention ''Gift Wrap'' in the order notes at checkout.', 5);

-- Insert Why Choose Us Cards
INSERT INTO public.why_choose_us_cards (title, description, icon_name, sort_order) VALUES
  ('Premium Quality', 'Every bag is crafted with premium materials and passes our strict quality checks.', 'Shield', 1),
  ('Fast Delivery', 'Get your order within 1-2 days in Dhaka and 3-5 days nationwide.', 'Truck', 2),
  ('Easy Returns', '7-day hassle-free return & exchange policy on all products.', 'RotateCcw', 3),
  ('Secure Payment', 'Cash on delivery available. Your payment is always safe with us.', 'Lock', 4);
