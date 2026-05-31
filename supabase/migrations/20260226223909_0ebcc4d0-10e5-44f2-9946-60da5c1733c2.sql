
-- Insert demo products
INSERT INTO products (name, slug, short_description, description, price, sale_price, stock, rating, review_count, featured, best_seller, category_id, images) VALUES
('Radiant Glow Serum', 'radiant-glow-serum', 'Brightening vitamin C serum for luminous skin', 'A powerful vitamin C serum that targets dark spots, uneven skin tone, and dullness.', 1850, 1499, 45, 4.8, 124, true, true, '04e26cc5-4449-453e-b7d2-fcbb1041a1ea', ARRAY['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600','https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=600']),
('Hydra Boost Moisturizer', 'hydra-boost-moisturizer', 'Deep hydration for all skin types', 'Lightweight yet deeply hydrating moisturizer with ceramides, squalane, and niacinamide.', 1200, NULL, 80, 4.6, 89, true, false, '04e26cc5-4449-453e-b7d2-fcbb1041a1ea', ARRAY['https://images.unsplash.com/photo-1570194065650-d99fb4b38b17?w=600']),
('Velvet Matte Lipstick', 'velvet-matte-lipstick', 'Long-lasting matte finish in rich shades', 'Creamy matte lipstick that glides on smoothly and stays put for up to 8 hours.', 650, 499, 120, 4.7, 203, true, true, '03d37a52-96f3-48f6-b53d-983323141305', ARRAY['https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600']),
('Silk Repair Hair Mask', 'silk-repair-hair-mask', 'Intensive repair treatment for damaged hair', 'Deep conditioning mask with keratin, argan oil, and silk proteins.', 950, NULL, 60, 4.5, 67, true, false, '4bf73854-57e7-4dba-9103-1b0def079f48', ARRAY['https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600']),
('Rose Body Butter', 'rose-body-butter', 'Rich nourishing body butter with rose extract', 'Luxuriously thick body butter infused with damask rose oil, shea butter, and cocoa butter.', 800, 699, 90, 4.9, 156, false, true, '5d7a32a1-c4af-4316-980b-7bfe9a9afd71', ARRAY['https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=600']),
('Gentle Foam Cleanser', 'gentle-foam-cleanser', 'pH-balanced daily facial cleanser', 'Sulfate-free foaming cleanser that removes makeup and impurities without stripping the skin.', 550, NULL, 150, 4.4, 98, false, false, '04e26cc5-4449-453e-b7d2-fcbb1041a1ea', ARRAY['https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600']),
('Luminous Foundation SPF30', 'luminous-foundation-spf30', 'Buildable coverage with sun protection', 'Medium-to-full coverage foundation with a natural satin finish.', 1400, 1199, 70, 4.3, 45, false, true, '03d37a52-96f3-48f6-b53d-983323141305', ARRAY['https://images.unsplash.com/photo-1631730486784-5aba34a92019?w=600']),
('Coconut Scalp Treatment', 'coconut-scalp-treatment', 'Soothing scalp oil for healthy hair growth', 'Lightweight scalp oil with coconut, tea tree, and peppermint.', 750, NULL, 40, 4.6, 34, false, false, '4bf73854-57e7-4dba-9103-1b0def079f48', ARRAY['https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600']);

-- Insert testimonials
INSERT INTO testimonials (name, review, rating, sort_order) VALUES
('Fatima Rahman', 'The Radiant Glow Serum completely transformed my skin! My dark spots faded within weeks.', 5, 0),
('Nadia Akter', 'I love the Rose Body Butter. The scent is divine and my skin feels so soft all day.', 5, 1),
('Aisha Khan', 'Best cleanser I have ever used. Gentle yet effective, no tightness after washing.', 4, 2),
('Tamanna Islam', 'The Velvet Matte Lipstick lasts through meals and looks amazing. Highly recommend!', 5, 3);

-- Insert why choose us cards
INSERT INTO why_choose_us_cards (title, description, icon_name, sort_order) VALUES
('100% Authentic', 'Every product is sourced directly from authorized distributors', 'ShieldCheck', 0),
('Free Shipping', 'Free delivery on orders above ৳2000 across Bangladesh', 'Truck', 1),
('Easy Returns', '7-day hassle-free return and exchange policy', 'RotateCcw', 2),
('Secure Payments', 'Multiple payment options with encrypted transactions', 'Lock', 3);

-- Insert home FAQs
INSERT INTO home_faqs (question, answer, sort_order) VALUES
('What payment methods do you accept?', 'We accept bKash, Nagad, Rocket, bank transfers, and cash on delivery across Bangladesh.', 0),
('How long does shipping take?', 'Orders within Dhaka are delivered within 1-2 business days. Outside Dhaka takes 3-5 business days.', 1),
('Do you offer international shipping?', 'Currently we only deliver within Bangladesh. International shipping coming soon!', 2),
('Are your products authentic?', 'Yes, all our products are 100% authentic and sourced directly from authorized distributors.', 3),
('What is your return policy?', 'We offer a 7-day return policy for unused products in original packaging. Contact us for returns.', 4);

-- Insert product tabs for first few products
INSERT INTO product_tabs (product_id, title, content, sort_order)
SELECT id, 'Description', description, 0 FROM products WHERE slug = 'radiant-glow-serum'
UNION ALL
SELECT id, 'How to Use', 'Apply 3-4 drops to clean, damp skin morning and evening. Follow with moisturizer and SPF in the morning. Avoid mixing with retinol.', 1 FROM products WHERE slug = 'radiant-glow-serum'
UNION ALL
SELECT id, 'Ingredients', 'Water, Ascorbic Acid (15%), Hyaluronic Acid, Ferulic Acid, Vitamin E, Glycerin, Niacinamide, Aloe Vera Extract', 2 FROM products WHERE slug = 'radiant-glow-serum'
UNION ALL
SELECT id, 'Description', description, 0 FROM products WHERE slug = 'velvet-matte-lipstick'
UNION ALL
SELECT id, 'Ingredients', 'Isododecane, Dimethicone, Trimethylsiloxysilicate, Vitamin E, Jojoba Oil, Beeswax, Iron Oxides', 1 FROM products WHERE slug = 'velvet-matte-lipstick';

-- Insert product FAQs
INSERT INTO product_faqs (product_id, question, answer, sort_order)
SELECT id, 'Is this suitable for sensitive skin?', 'Yes, our Vitamin C serum is formulated at a gentle concentration suitable for most skin types. We recommend patch testing first.', 0 FROM products WHERE slug = 'radiant-glow-serum'
UNION ALL
SELECT id, 'How long does one bottle last?', 'With daily use (morning and evening), one 30ml bottle typically lasts 6-8 weeks.', 1 FROM products WHERE slug = 'radiant-glow-serum';
