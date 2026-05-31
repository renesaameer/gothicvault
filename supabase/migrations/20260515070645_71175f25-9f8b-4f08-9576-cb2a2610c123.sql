
-- ================= SPEOS DEMO SEED =================

-- Singleton settings
INSERT INTO shop_settings (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;
INSERT INTO design_settings (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;
INSERT INTO whatsapp_settings (id, phone_number, enabled) VALUES ('default','+8801712345678', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO floating_icons_settings (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;

INSERT INTO announcement_bar (id, text, link, bg_color, text_color, enabled, dismissible)
VALUES ('default','Free shipping inside Dhaka on orders over ৳3,000 — Limited time','/shop','#0D3B2A','#F5F5F2', true, true)
ON CONFLICT (id) DO UPDATE SET text=EXCLUDED.text, enabled=true;

INSERT INTO footer_settings (id, store_name, description, email, phone, address, copyright_text, social_links, quick_links, customer_care_links, newsletter_enabled)
VALUES ('default','SPEOS','Sophisticated premium wallets — handcrafted leather essentials for the modern gentleman.','hello@speos.com.bd','+880 1712-345678','House 21, Road 11, Banani, Dhaka 1213','© {year} SPEOS. All rights reserved.',
 '[{"platform":"facebook","url":"https://facebook.com/speos"},{"platform":"instagram","url":"https://instagram.com/speos"}]'::jsonb,
 '[{"label":"Shop","url":"/shop"},{"label":"About","url":"/about"},{"label":"Contact","url":"/contact"},{"label":"Track Order","url":"/track-order"}]'::jsonb,
 '[{"label":"Shipping Policy","url":"/policies/shipping"},{"label":"Return Policy","url":"/policies/return"},{"label":"Privacy Policy","url":"/policies/privacy"},{"label":"Terms of Service","url":"/policies/terms"}]'::jsonb,
 true)
ON CONFLICT (id) DO UPDATE SET store_name=EXCLUDED.store_name, description=EXCLUDED.description, email=EXCLUDED.email, phone=EXCLUDED.phone, address=EXCLUDED.address, social_links=EXCLUDED.social_links, quick_links=EXCLUDED.quick_links, customer_care_links=EXCLUDED.customer_care_links;

INSERT INTO contact_settings (id, page_title, page_intro, email_address, phone_number, business_address, receiving_email, show_address, phone_field_enabled, submit_button_text, social_section_enabled, social_links, map_enabled)
VALUES ('default','Get in touch','We''d love to help — reach out anytime, our team usually replies within a few hours.','hello@speos.com.bd','+880 1712-345678','House 21, Road 11, Banani, Dhaka 1213','hello@speos.com.bd', true, true, 'Send Message', true,
 '[{"platform":"facebook","url":"https://facebook.com/speos"},{"platform":"instagram","url":"https://instagram.com/speos"},{"platform":"whatsapp","url":"https://wa.me/8801712345678"}]'::jsonb,
 false)
ON CONFLICT (id) DO UPDATE SET page_title=EXCLUDED.page_title, page_intro=EXCLUDED.page_intro, email_address=EXCLUDED.email_address, phone_number=EXCLUDED.phone_number, business_address=EXCLUDED.business_address;

INSERT INTO invoice_settings (id, store_name, store_address, store_phone, store_email, footer_note, terms_text, signature_label)
VALUES ('default','SPEOS','House 21, Road 11, Banani, Dhaka 1213','+880 1712-345678','hello@speos.com.bd','Thank you for shopping with SPEOS.','Goods sold are non-refundable after 7 days from delivery.','Authorized Signature')
ON CONFLICT (id) DO NOTHING;

-- Categories
INSERT INTO categories (id, name, slug, sort_order, image_url) VALUES
 ('11111111-1111-1111-1111-111111111101','Bifold Wallets','bifold-wallets',1,'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800'),
 ('11111111-1111-1111-1111-111111111102','Cardholders','cardholders',2,'https://images.unsplash.com/photo-1517254797898-04edd251bfb3?w=800'),
 ('11111111-1111-1111-1111-111111111103','Long Wallets','long-wallets',3,'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=800'),
 ('11111111-1111-1111-1111-111111111104','Money Clips','money-clips',4,'https://images.unsplash.com/photo-1559563458-527698bf5295?w=800')
ON CONFLICT (id) DO NOTHING;

-- Brands
INSERT INTO brands (id, name, slug, sort_order, description) VALUES
 ('22222222-2222-2222-2222-222222222201','SPEOS Atelier','speos-atelier',1,'Our flagship in-house line.'),
 ('22222222-2222-2222-2222-222222222202','SPEOS Heritage','speos-heritage',2,'Hand-stitched classics.')
ON CONFLICT (id) DO NOTHING;

-- Featured categories
INSERT INTO featured_categories (category_id, title, image_url, sort_order) VALUES
 ('11111111-1111-1111-1111-111111111101','Bifold Wallets','https://images.unsplash.com/photo-1627123424574-724758594e93?w=1000',1),
 ('11111111-1111-1111-1111-111111111102','Cardholders','https://images.unsplash.com/photo-1517254797898-04edd251bfb3?w=1000',2),
 ('11111111-1111-1111-1111-111111111103','Long Wallets','https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=1000',3)
ON CONFLICT DO NOTHING;

-- Products
INSERT INTO products (id, name, slug, price, sale_price, stock, sku, short_description, description, images, featured, best_seller, category_id, brand_id, rating, review_count, stock_status_text, shipping_text)
VALUES
 ('33333333-3333-3333-3333-333333333301','Emerald Bifold Wallet','emerald-bifold-wallet',4500,3850,42,'SPS-BF-001',
  'Hand-stitched full-grain leather bifold with RFID protection.',
  'The Emerald Bifold is crafted from full-grain Italian leather and finished with waxed linen thread. RFID-blocking lining keeps your cards safe, while six card slots and two hidden pockets keep everything organised. Patina deepens beautifully with age.',
  ARRAY['https://images.unsplash.com/photo-1627123424574-724758594e93?w=1200','https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=1200','https://images.unsplash.com/photo-1559563458-527698bf5295?w=1200'],
  true, true, '11111111-1111-1111-1111-111111111101','22222222-2222-2222-2222-222222222201',4.8,124,'In stock — ships in 24h','Free delivery in Dhaka over ৳3,000'),
 ('33333333-3333-3333-3333-333333333302','Onyx Slim Cardholder','onyx-slim-cardholder',2800,2350,80,'SPS-CH-002',
  'Minimalist 5-card holder in vegetable-tanned leather.',
  'A whisper-thin everyday carry. Five precision-cut card slots and a center pull-tab pocket. Vegetable-tanned leather develops a rich patina within weeks.',
  ARRAY['https://images.unsplash.com/photo-1517254797898-04edd251bfb3?w=1200','https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=1200'],
  true, true, '11111111-1111-1111-1111-111111111102','22222222-2222-2222-2222-222222222201',4.9,86,'In stock','Ships next business day'),
 ('33333333-3333-3333-3333-333333333303','Heritage Long Wallet','heritage-long-wallet',6800,5950,18,'SPS-LW-003',
  'Spacious long wallet with twelve card slots and zip pocket.',
  'Designed for travel and daily use. Twelve card slots, a long bill compartment and a secure zip pocket for coins or receipts. Hand-burnished edges throughout.',
  ARRAY['https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=1200','https://images.unsplash.com/photo-1627123424574-724758594e93?w=1200'],
  true, false, '11111111-1111-1111-1111-111111111103','22222222-2222-2222-2222-222222222202',4.7,52,'Only 18 left','Free delivery in Dhaka over ৳3,000'),
 ('33333333-3333-3333-3333-333333333304','Gold Money Clip','gold-money-clip',1950,NULL,120,'SPS-MC-004',
  'Brass money clip with brushed gold finish.',
  'Solid brass with a brushed gold finish. Strong spring tension holds up to 15 notes. Comes in a SPEOS gift box.',
  ARRAY['https://images.unsplash.com/photo-1559563458-527698bf5295?w=1200'],
  false, true, '11111111-1111-1111-1111-111111111104','22222222-2222-2222-2222-222222222201',4.6,38,'In stock','Ships in 24h'),
 ('33333333-3333-3333-3333-333333333305','Forest Trifold Wallet','forest-trifold-wallet',5200,4400,30,'SPS-TF-005',
  'Compact trifold wallet with nine card slots.',
  'A compact trifold combining capacity and slim profile. Nine card slots, two bill compartments and an ID window.',
  ARRAY['https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=1200','https://images.unsplash.com/photo-1627123424574-724758594e93?w=1200'],
  false, false, '11111111-1111-1111-1111-111111111101','22222222-2222-2222-2222-222222222202',4.5,29,'In stock','Free delivery in Dhaka over ৳3,000'),
 ('33333333-3333-3333-3333-333333333306','Ivory Card Sleeve','ivory-card-sleeve',1850,1500,200,'SPS-CH-006',
  'Ultra-slim 3-card sleeve in pebble grain leather.',
  'Pocket-friendly sleeve for the essential three cards. Pebble-grain leather offers grip and durability.',
  ARRAY['https://images.unsplash.com/photo-1517254797898-04edd251bfb3?w=1200'],
  false, true, '11111111-1111-1111-1111-111111111102','22222222-2222-2222-2222-222222222201',4.7,61,'In stock','Ships next business day')
ON CONFLICT (id) DO NOTHING;

-- Product tabs (specs / care / shipping)
INSERT INTO product_tabs (product_id, title, content, display_style, sort_order)
SELECT p.id, t.title, t.content, t.display_style, t.sort_order FROM products p
CROSS JOIN (VALUES
 ('Specifications','Material: Full-grain Italian leather\nDimensions: 11 × 9 × 1.5 cm\nWeight: 85g\nClosure: Bifold\nLining: RFID-blocking fabric','minimal_list',1),
 ('Care','Wipe with a soft dry cloth. Avoid prolonged exposure to water and direct sunlight. Use a quality leather conditioner every 3-4 months to maintain suppleness.','text',2),
 ('Shipping & Returns','Free shipping in Dhaka on orders over ৳3,000.\nNationwide delivery within 2-4 business days.\n7-day easy returns on unused items.','minimal_list',3)
) AS t(title,content,display_style,sort_order)
WHERE NOT EXISTS (SELECT 1 FROM product_tabs WHERE product_id = p.id);

-- Product FAQs
INSERT INTO product_faqs (product_id, question, answer, sort_order)
SELECT p.id, f.question, f.answer, f.sort_order FROM products p
CROSS JOIN (VALUES
 ('Is the wallet RFID protected?','Yes — every SPEOS wallet includes RFID-blocking lining to keep your cards safe.',1),
 ('What is the warranty?','We offer a 1-year warranty against manufacturing defects.',2),
 ('Do you ship outside Dhaka?','Yes, we deliver nationwide across Bangladesh in 2-4 business days.',3)
) AS f(question,answer,sort_order)
WHERE NOT EXISTS (SELECT 1 FROM product_faqs WHERE product_id = p.id);

-- Product offers
INSERT INTO product_offers (product_id, offer_type, display_text, buy_quantity, get_quantity, discount_value, sort_order)
SELECT p.id, 'buy_x_get_discount', 'Buy 2 get 10% off', 2, NULL, 10, 1 FROM products p
WHERE NOT EXISTS (SELECT 1 FROM product_offers WHERE product_id = p.id);

-- Reviews
INSERT INTO reviews (product_id, customer_name, rating, comment)
SELECT p.id, r.customer_name, r.rating, r.comment FROM products p
CROSS JOIN (VALUES
 ('Tanvir Ahmed',5,'Premium build, the leather feels incredible. Worth every taka.'),
 ('Sadia Rahman',5,'Gifted to my husband — he loves it. Fast delivery in Dhaka.'),
 ('Imran Hossain',4,'Beautiful craftsmanship. Slightly tight at first but loosens up nicely.')
) AS r(customer_name,rating,comment)
WHERE NOT EXISTS (SELECT 1 FROM reviews WHERE product_id = p.id);

-- Hero slides
INSERT INTO hero_slides (title, subtitle, button_text, button_link, image_url, sort_order) VALUES
 ('Crafted for the Modern Gentleman','Hand-stitched leather wallets, made to last a lifetime.','Shop the Collection','/shop','https://images.unsplash.com/photo-1627123424574-724758594e93?w=1920',1),
 ('The Heritage Long Wallet','Spacious. Refined. Effortlessly elegant.','Discover','/shop','https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=1920',2),
 ('Slim Cardholders','Minimalist essentials for everyday carry.','Browse Cardholders','/shop','https://images.unsplash.com/photo-1517254797898-04edd251bfb3?w=1920',3)
ON CONFLICT DO NOTHING;

-- Testimonials
INSERT INTO testimonials (name, review, rating, image_url, sort_order) VALUES
 ('Rashed Karim','Best wallet I''ve ever owned. The leather quality is exceptional.',5,'https://i.pravatar.cc/200?img=12',1),
 ('Nusrat Jahan','Bought as a gift — beautifully packaged and delivered on time.',5,'https://i.pravatar.cc/200?img=47',2),
 ('Mahmud Hasan','Slim, elegant, and well-made. Highly recommend SPEOS.',5,'https://i.pravatar.cc/200?img=33',3),
 ('Farhana Akter','Loved the customer service. Will buy again.',4,'https://i.pravatar.cc/200?img=21',4)
ON CONFLICT DO NOTHING;

-- Why choose us
INSERT INTO why_choose_us_cards (title, description, icon_name, sort_order) VALUES
 ('Premium Leather','Sourced from Italy''s finest tanneries.','Shield',1),
 ('Hand-Stitched','Each piece crafted by skilled artisans.','Award',2),
 ('Fast Delivery','Dhaka next-day, nationwide in 2-4 days.','Truck',3),
 ('1-Year Warranty','We stand behind every wallet we make.','BadgeCheck',4)
ON CONFLICT DO NOTHING;

-- Home FAQs
INSERT INTO home_faqs (question, answer, sort_order) VALUES
 ('How long does delivery take?','Inside Dhaka: 1-2 days. Outside Dhaka: 2-4 business days.',1),
 ('Do you offer cash on delivery?','Yes, COD is available across Bangladesh.',2),
 ('Can I return or exchange a wallet?','Yes, within 7 days of delivery for unused items in original packaging.',3),
 ('Are the wallets RFID protected?','All SPEOS wallets include RFID-blocking lining.',4)
ON CONFLICT DO NOTHING;

-- About sections
INSERT INTO about_sections (id, sort_order, content) VALUES
 ('hero',1,'{"title":"Crafted with Intention","subtitle":"SPEOS — Sophisticated Premium Essentials for Outstanding Style","image":"https://images.unsplash.com/photo-1627123424574-724758594e93?w=1600","body":"Founded in Dhaka in 2022, SPEOS is a small atelier obsessed with the art of leather. We design wallets that age with grace and serve you for decades, not seasons."}'::jsonb),
 ('story',2,'{"title":"Our Story","body":"What began as a single bifold made for a friend has grown into a quiet movement of people who value craft over trend. Every SPEOS piece is hand-stitched in our Banani workshop using full-grain leather sourced from Italy''s most respected tanneries.","image":"https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=1600"}'::jsonb),
 ('values',3,'{"title":"What We Stand For","items":[{"title":"Craftsmanship","description":"Each wallet is hand-stitched and edge-burnished by a single artisan."},{"title":"Materials","description":"Full-grain Italian leather, waxed linen thread, solid brass hardware."},{"title":"Longevity","description":"Designed and warranted to last a decade or more."}]}'::jsonb),
 ('cta',4,'{"title":"Carry Something Made to Last","button_text":"Shop the Collection","button_link":"/shop"}'::jsonb)
ON CONFLICT (id) DO UPDATE SET content=EXCLUDED.content, sort_order=EXCLUDED.sort_order;

-- Policies
INSERT INTO policies (slug, title, content, sort_order) VALUES
 ('shipping','Shipping Policy',E'## Delivery Times\n- Inside Dhaka: 1-2 business days\n- Outside Dhaka: 2-4 business days\n\n## Delivery Charges\n- Inside Dhaka: ৳70 (free over ৳3,000)\n- Outside Dhaka: ৳120 (free over ৳5,000)\n\n## Order Tracking\nYou will receive an SMS with your tracking number once your order is shipped.',1),
 ('return','Return & Refund Policy',E'## 7-Day Returns\nUnused items in original packaging may be returned within 7 days of delivery for a full refund.\n\n## Exchanges\nFree exchanges within 14 days for size or color.\n\n## How to Request\nContact us at hello@speos.com.bd or WhatsApp +880 1712-345678.',2),
 ('privacy','Privacy Policy',E'We respect your privacy. We collect only the information necessary to fulfil your order and improve your experience. We never sell your data to third parties.',3),
 ('terms','Terms of Service',E'By using this website you agree to our terms. All products are sold subject to availability. Prices are listed in BDT and may change without notice.',4)
ON CONFLICT DO NOTHING;

-- Delivery zones
INSERT INTO delivery_zones (name, zone_name, areas, delivery_charge, shipping_cost, free_delivery_minimum, free_shipping_threshold, estimated_days, sort_order) VALUES
 ('Inside Dhaka','Inside Dhaka','["Dhaka","Banani","Gulshan","Dhanmondi","Mirpur","Uttara","Mohammadpur"]'::jsonb,70,70,3000,3000,'1-2 days',1),
 ('Outside Dhaka','Outside Dhaka','["Chattogram","Sylhet","Khulna","Rajshahi","Barishal","Rangpur","Mymensingh","Cumilla"]'::jsonb,120,120,5000,5000,'2-4 days',2)
ON CONFLICT DO NOTHING;

-- Direct order channels
INSERT INTO direct_order_channels (label, identifier, message_template, sort_order) VALUES
 ('WhatsApp','+8801712345678','Hi SPEOS, I''d like to order: {product_name}',1),
 ('Messenger','speos','Hi SPEOS, I''m interested in {product_name}',2)
ON CONFLICT DO NOTHING;
