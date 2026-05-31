
-- Products (8 total)
INSERT INTO public.products (name, slug, price, sale_price, stock, featured, best_seller, images, short_description, description, category_id, sku, rating, review_count) VALUES
('Classic Black Abaya','classic-black-abaya',2890,2490,40,true,true,ARRAY['/products/abaya-classic.jpg'],'Timeless flowy black abaya in soft nida fabric.','A wardrobe essential — flowy nida fabric, comfortable cut, full-length sleeves and breathable lining. Perfect for everyday and special occasions.','4ba43eaf-5d93-4b4e-aa75-a4e561f73ec4','NA-AB-001',5,42),
('Dusty Rose Embroidered Abaya','dusty-rose-embroidered-abaya',3490,NULL,25,true,false,ARRAY['/products/abaya-rose.jpg'],'Soft dusty rose abaya with delicate cuff embroidery.','Crafted in premium nida with subtle floral embroidery on the cuffs. A graceful piece for festive gatherings and family events.','4ba43eaf-5d93-4b4e-aa75-a4e561f73ec4','NA-AB-002',5,18),
('Royal Navy Embroidered Abaya','royal-navy-embroidered-abaya',4290,3890,15,false,true,ARRAY['/products/abaya-navy.jpg'],'Deep navy Dubai-style abaya with intricate gold embroidery.','A statement piece — Dubai-style cut in deep navy with hand-finished golden embroidery down the front and cuffs.','4ba43eaf-5d93-4b4e-aa75-a4e561f73ec4','NA-AB-003',5,24),
('Beige Belted Khimar','beige-belted-khimar',1990,NULL,35,true,false,ARRAY['/products/khimar-beige.jpg'],'Two-piece beige khimar with belted waist.','Premium chiffon-blend khimar with belted waist for a flattering silhouette. Light, breathable and easy to drape.','f69db930-5a0a-43f2-9cea-0080c26c5d8b','NA-KH-001',4,12),
('Sage Chiffon Khimar','sage-chiffon-khimar',1690,1390,28,false,false,ARRAY['/products/khimar-sage.jpg'],'Soft sage chiffon khimar with full back coverage.','Lightweight flowy chiffon in calming sage. Generous coverage with elegant drape.','f69db930-5a0a-43f2-9cea-0080c26c5d8b','NA-KH-002',5,9),
('Mocha Brown Set','mocha-brown-abaya-khimar-set',3990,3490,18,true,true,ARRAY['/products/set-mocha.jpg'],'Matching abaya & khimar set in warm mocha brown.','Coordinated abaya and khimar set in warm mocha. Soft fabric, relaxed cut — effortless modesty in one bundle.','c2ceec99-bed7-463f-866a-742bbca1e135','NA-ST-001',5,21),
('Champagne Beige Set','champagne-beige-set',4290,NULL,12,true,false,ARRAY['/products/set-champagne.jpg'],'Elegant champagne abaya & khimar set for special days.','A refined coordinated set in soft champagne — perfect for weddings, Eid and evening events.','c2ceec99-bed7-463f-866a-742bbca1e135','NA-ST-002',5,7),
('Satin Hijab & Brooch Set','satin-hijab-brooch-set',790,590,60,false,true,ARRAY['/products/accessory-hijab-set.jpg'],'Premium black satin hijab paired with a sparkling brooch.','Smooth satin hijab in classic black with a stylish floral crystal brooch. The perfect finishing touch.','27043340-d66d-49e3-bfff-9f8f4c85da2c','NA-AC-001',4,15);

-- Hero slides
UPDATE public.hero_slides SET image_url = '/hero/hero-1.jpg' WHERE sort_order = 1 AND image_url = '/logo.png';
INSERT INTO public.hero_slides (sort_order, enabled, image_url, title, subtitle, button_text, button_link) VALUES
(2, true, '/hero/hero-2.jpg', 'Quality You Can Feel', 'Premium fabrics, considered fit, made to last.', 'Explore Sets', '/shop?category=sets');

-- Testimonials
INSERT INTO public.testimonials (sort_order, name, rating, review, image_url) VALUES
(1, 'Ayesha R.', 5, 'The fabric quality is amazing — soft, breathable and falls beautifully. My new go-to for daily wear.', ''),
(2, 'Sumaiya K.', 5, 'Ordered the mocha set for Eid and it was perfect. Loved the packaging and quick delivery in Dhaka.', ''),
(3, 'Nadia H.', 5, 'Fits exactly as described. Modest, elegant and great value. Will be ordering again insha''Allah.', ''),
(4, 'Tasnim B.', 4, 'Beautiful navy abaya with stunning embroidery. Got many compliments at a recent family gathering.', '');

-- Why choose us
INSERT INTO public.why_choose_us_cards (sort_order, icon_name, title, description) VALUES
(1, 'Shield', 'Premium Fabrics', 'Hand-picked nida, chiffon and crepe — soft, breathable and built to last.'),
(2, 'Truck', 'Fast Nationwide Delivery', 'Inside Dhaka in 24–48 hours, outside Dhaka in 3–5 working days.'),
(3, 'Heart', 'Modest by Design', 'Generous cuts, full coverage and elegant finishing on every piece.'),
(4, 'RefreshCw', '7-Day Easy Exchange', 'Not the right fit? Exchange within 7 days, no questions asked.');

-- Home FAQs
INSERT INTO public.home_faqs (sort_order, question, answer) VALUES
(1, 'How do I choose the right size?', 'All our abayas are designed to be loose-fitting. Refer to the size chart on each product page — most styles are available in S, M, L and XL.'),
(2, 'Do you ship outside Dhaka?', 'Yes, we deliver across Bangladesh. Dhaka orders arrive in 1–2 days, outside Dhaka in 3–5 working days.'),
(3, 'What is your return policy?', 'We offer a 7-day exchange on unworn items in original condition. Sale items are final sale.'),
(4, 'Can I order via WhatsApp?', 'Absolutely — message us on WhatsApp and our team will help you place an order, share extra photos or answer any questions.');

-- Category cover images
UPDATE public.categories SET image_url = '/products/abaya-classic.jpg' WHERE slug = 'abayas';
UPDATE public.categories SET image_url = '/products/khimar-beige.jpg' WHERE slug = 'khimars';
UPDATE public.categories SET image_url = '/products/set-mocha.jpg' WHERE slug = 'sets';
UPDATE public.categories SET image_url = '/products/accessory-hijab-set.jpg' WHERE slug = 'accessories';

-- Refresh About + add policy pages
UPDATE public.policies SET content =
'Nupur Abaya And More is a modest fashion label from Dhaka, Bangladesh, dedicated to thoughtfully made abayas, khimars and coordinated sets.

**Our Promise**

We believe modesty and elegance go hand-in-hand. Every piece in our collection is selected for its fabric quality, generous fit and timeless design — pieces you''ll reach for again and again.

**What We Offer**

- Everyday and occasion-wear abayas
- Two-piece khimars and sets
- Premium hijabs and finishing accessories

**Why Customers Choose Us**

- Hand-picked premium fabrics
- Honest pricing — no inflated MRPs
- Cash on delivery across Bangladesh
- 7-day easy exchange and friendly WhatsApp support

We''re a small team building something we''re proud of. Thank you for being part of it.',
updated_at = now()
WHERE slug = 'about';

INSERT INTO public.policies (slug, title, content, enabled, sort_order) VALUES
('shipping', 'Shipping & Delivery',
'**Delivery Areas & Timeline**

- **Inside Dhaka:** 1–2 working days
- **Outside Dhaka:** 3–5 working days
- We deliver across all 64 districts of Bangladesh.

**Shipping Charges**

- Inside Dhaka: ৳70
- Outside Dhaka: ৳130
- Free delivery on orders above ৳3,000.

**Order Tracking**

Once dispatched, you''ll receive a tracking number by SMS and WhatsApp. You can also track your order using your phone number on our Track Order page.

**Cash on Delivery**

Available across Bangladesh. Please keep the exact amount ready when our courier arrives.', true, 2),

('returns', 'Returns & Exchange',
'**7-Day Easy Exchange**

We want you to love what you wear. If something isn''t quite right, we offer exchanges within 7 days of delivery.

**Conditions**

- Item must be unworn, unwashed and in original condition with tags attached.
- Original packaging must be returned with the item.
- Sale and clearance items are final sale and cannot be exchanged.

**How to Request an Exchange**

1. WhatsApp us at +8801700000000 with your order number and reason.
2. Our team will share return instructions.
3. Once we receive and inspect the item, we''ll dispatch your replacement.

**Refunds**

We offer exchanges or store credit. Cash refunds are processed only when a replacement is unavailable.', true, 3),

('privacy', 'Privacy Policy',
'We respect your privacy. The information you share with us — name, phone, address, email — is used only to process your orders and keep you updated about your purchases.

**What we collect**

- Contact details (name, phone, email, address) when you place an order or sign up for our newsletter.
- Order history to provide better service and recommendations.

**How we use it**

- To fulfil and deliver your orders.
- To send order updates via SMS, WhatsApp and email.
- To send occasional offers if you''ve subscribed (you can unsubscribe anytime).

**What we don''t do**

- We never sell or rent your personal information to third parties.
- Payment data is handled securely and not stored on our servers.', true, 4),

('terms', 'Terms & Conditions',
'By using our website you agree to the following:

- All product images are representative; slight variation in colour may occur due to screen settings and lighting.
- Prices are listed in BDT (৳) and inclusive of applicable taxes.
- Orders are confirmed only after our team reaches you for verification.
- We reserve the right to cancel orders in case of pricing errors, stock issues or suspicious activity.
- All content, images and branding on this site belong to Nupur Abaya And More and may not be reused without permission.

For any questions, reach out via our Contact page or WhatsApp.', true, 5);

-- Contact page refinements
UPDATE public.contact_settings SET
  page_intro = 'Have a question about an order, sizing or fabric? Message us on WhatsApp for the fastest reply, or send us a note below — we usually respond within a few hours.',
  business_address = 'Dhanmondi, Dhaka, Bangladesh',
  show_address = true,
  faq_shortcut_enabled = true,
  faq_shortcut_items = '[
    {"question":"How do I track my order?","answer":"Use our Track Order page with your phone number, or message us on WhatsApp."},
    {"question":"Do you offer cash on delivery?","answer":"Yes, COD is available across Bangladesh."},
    {"question":"How long does delivery take?","answer":"1–2 days inside Dhaka, 3–5 days outside Dhaka."}
  ]'::jsonb,
  updated_at = now()
WHERE id = 'default';

-- Delivery zones
INSERT INTO public.delivery_zones (sort_order, enabled, name, zone_name, areas, delivery_charge, shipping_cost, free_delivery_minimum, free_shipping_threshold, estimated_days) VALUES
(1, true, 'Inside Dhaka', 'Inside Dhaka', '["Dhaka City"]'::jsonb, 70, 70, 3000, 3000, '1-2 days'),
(2, true, 'Outside Dhaka', 'Outside Dhaka', '["All other districts"]'::jsonb, 130, 130, 5000, 5000, '3-5 days');
