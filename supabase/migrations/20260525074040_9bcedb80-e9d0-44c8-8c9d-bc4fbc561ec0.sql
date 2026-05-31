
-- ============================================================================
-- AEROM wallet store seed
-- Idempotent: safe to re-run. Uses deterministic UUIDs + on conflict do nothing.
-- ============================================================================

-- Brand: rename to AEROM
update public.brands
set name = 'AEROM', slug = 'aerom', description = 'Premium leather wallets, handcrafted for modern carry.'
where id = '22222222-2222-2222-2222-222222222201';

-- Categories
insert into public.categories (id, name, slug, sort_order, enabled, category_type, level, path, full_slug) values
  ('a1111111-1111-1111-1111-111111111101','Bifold Wallets','bifold-wallets',1,true,'category',1,'','bifold-wallets'),
  ('a1111111-1111-1111-1111-111111111102','Cardholders','cardholders',2,true,'category',1,'','cardholders'),
  ('a1111111-1111-1111-1111-111111111103','Long Wallets','long-wallets',3,true,'category',1,'','long-wallets'),
  ('a1111111-1111-1111-1111-111111111104','Money Clips','money-clips',4,true,'category',1,'','money-clips')
on conflict (id) do nothing;

-- Upgrade existing product into AEROM flagship Bifold
update public.products set
  name = 'Aerom Heritage Bifold',
  slug = 'aerom-heritage-bifold',
  short_description = 'Full-grain leather bifold, hand-stitched for a lifetime of carry.',
  description = 'The Heritage Bifold is our signature everyday wallet. Cut from full-grain Italian leather and hand-stitched with waxed linen thread, it holds eight cards, two bill compartments, and a hidden cash pocket. Slim profile, soft to the hand, and engineered to develop a deep patina over years of use.',
  price = 3200, sale_price = 2700, stock = 48, sku = 'AER-BF-001',
  category_id = 'a1111111-1111-1111-1111-111111111101',
  brand_id = '22222222-2222-2222-2222-222222222201',
  featured = true, best_seller = true, is_new_arrival = false,
  status = 'active', base_price = 3200, compare_price = 3500,
  show_shipping_text = true, show_stock_status = true, show_shipping_info = true, show_offers = true,
  shipping_text = 'Free delivery on orders over ৳3000',
  stock_status_text = 'In stock — ships within 24 hours',
  rating = 4.9, review_count = 124, sort_order = 1
where id = 'e0cc40f8-9891-45c9-af79-7e255d3d682c';

-- New products
insert into public.products
  (id, name, slug, short_description, description, price, sale_price, stock, sku,
   category_id, brand_id, featured, best_seller, is_new_arrival, status,
   base_price, compare_price, show_shipping_text, show_stock_status, show_shipping_info, show_offers,
   shipping_text, stock_status_text, rating, review_count, sort_order)
values
  ('b0000000-0000-0000-0000-000000000002','Aerom Minimalist Cardholder','aerom-minimalist-cardholder',
   'Slim six-slot cardholder in pebbled full-grain leather.',
   'A precision-cut cardholder for the modern minimalist. Six slots, a center sleeve for folded cash or a spare key, and a slim 6mm profile that disappears in your front pocket. Edges are hand-painted and burnished for a clean finish.',
   1800, 1499, 86, 'AER-CH-002','a1111111-1111-1111-1111-111111111102','22222222-2222-2222-2222-222222222201',
   true, true, false,'active', 1800, 2000, true, true, true, true,
   'Free delivery on orders over ৳3000','In stock — ships within 24 hours', 4.8, 92, 2),

  ('b0000000-0000-0000-0000-000000000003','Aerom Executive Long Wallet','aerom-executive-long-wallet',
   'Twelve-card long wallet with zippered coin pocket.',
   'Crafted for those who carry more — twelve card slots, three bill compartments, a zippered coin pocket, and a clear ID window. Cut from vegetable-tanned leather that softens beautifully with use.',
   4500, 3800, 22, 'AER-LW-003','a1111111-1111-1111-1111-111111111103','22222222-2222-2222-2222-222222222201',
   true, false, true,'active', 4500, 4900, true, true, true, true,
   'Free delivery on orders over ৳3000','Only a few left in stock', 4.9, 47, 3),

  ('b0000000-0000-0000-0000-000000000004','Aerom Carbon Money Clip','aerom-carbon-money-clip',
   'Leather + stainless steel clip for the lightest carry.',
   'The lightest wallet we make. A four-slot leather sleeve fused to a brushed stainless steel clip. Holds up to twelve folded notes and eight cards while staying under 60 grams.',
   2200, null, 60, 'AER-MC-004','a1111111-1111-1111-1111-111111111104','22222222-2222-2222-2222-222222222201',
   false, true, true,'active', 2200, 2200, true, true, true, true,
   'Free delivery on orders over ৳3000','In stock — ships within 24 hours', 4.7, 38, 4),

  ('b0000000-0000-0000-0000-000000000005','Aerom Classic Bifold — Cognac','aerom-classic-bifold-cognac',
   'Traditional bifold in warm cognac full-grain leather.',
   'A timeless bifold reimagined in warm cognac. Eight card slots, two bill compartments, and a soft suede lining. Tonal stitching and a low-key debossed wordmark keep it understated.',
   2900, 2450, 34, 'AER-BF-005','a1111111-1111-1111-1111-111111111101','22222222-2222-2222-2222-222222222201',
   true, false, false,'active', 2900, 3200, true, true, true, true,
   'Free delivery on orders over ৳3000','In stock — ships within 24 hours', 4.8, 71, 5),

  ('b0000000-0000-0000-0000-000000000006','Aerom Slim Cardholder — Onyx','aerom-slim-cardholder-onyx',
   'Four-slot front-pocket cardholder, deep onyx black.',
   'Stripped to the essentials. Four card slots, no extra bulk, finished in a matte onyx leather that resists scuffs. Cut and stitched entirely by hand.',
   1500, null, 120, 'AER-CH-006','a1111111-1111-1111-1111-111111111102','22222222-2222-2222-2222-222222222201',
   false, true, false,'active', 1500, 1500, true, true, true, true,
   'Free delivery on orders over ৳3000','In stock — ships within 24 hours', 4.6, 58, 6),

  ('b0000000-0000-0000-0000-000000000007','Aerom Travel Long Wallet','aerom-travel-long-wallet',
   'Long wallet sized for passports, boarding passes, and cards.',
   'A travel companion designed around your passport. Dedicated passport sleeve, two currency compartments, six card slots, and a pen loop. Built from durable saffiano-textured leather.',
   5200, 4400, 18, 'AER-LW-007','a1111111-1111-1111-1111-111111111103','22222222-2222-2222-2222-222222222201',
   true, false, true,'active', 5200, 5600, true, true, true, true,
   'Free delivery on orders over ৳3000','Only a few left in stock', 4.9, 31, 7),

  ('b0000000-0000-0000-0000-000000000008','Aerom Gift Box — Bifold + Cardholder','aerom-gift-box-bifold-cardholder',
   'Bifold and matching cardholder in a linen-lined gift box.',
   'Our two best-sellers paired in a linen-lined presentation box. Includes the Heritage Bifold and Minimalist Cardholder in matching leather, plus a hand-written note card.',
   4800, 3999, 25, 'AER-GB-008','a1111111-1111-1111-1111-111111111101','22222222-2222-2222-2222-222222222201',
   true, true, true,'active', 4800, 5400, true, true, true, true,
   'Free delivery — ready to gift','In stock — ships within 24 hours', 5.0, 19, 8)
on conflict (id) do nothing;

-- Product media (Unsplash wallet imagery — 2 images per product)
insert into public.product_media (product_id, image_url, sort_order, type) values
  ('e0cc40f8-9891-45c9-af79-7e255d3d682c','https://images.unsplash.com/photo-1627123424574-724758594e93?w=1200&q=80',0,'image'),
  ('e0cc40f8-9891-45c9-af79-7e255d3d682c','https://images.unsplash.com/photo-1606503825008-909a67e63c3d?w=1200&q=80',1,'image'),
  ('e0cc40f8-9891-45c9-af79-7e255d3d682c','https://images.unsplash.com/photo-1572807767021-58a022e95f43?w=1200&q=80',2,'image'),

  ('b0000000-0000-0000-0000-000000000002','https://images.unsplash.com/photo-1559563458-527698bf5295?w=1200&q=80',0,'image'),
  ('b0000000-0000-0000-0000-000000000002','https://images.unsplash.com/photo-1517254797898-04edd251bfb3?w=1200&q=80',1,'image'),
  ('b0000000-0000-0000-0000-000000000002','https://images.unsplash.com/photo-1606503825008-909a67e63c3d?w=1200&q=80',2,'image'),

  ('b0000000-0000-0000-0000-000000000003','https://images.unsplash.com/photo-1606503825008-909a67e63c3d?w=1200&q=80',0,'image'),
  ('b0000000-0000-0000-0000-000000000003','https://images.unsplash.com/photo-1627123424574-724758594e93?w=1200&q=80',1,'image'),

  ('b0000000-0000-0000-0000-000000000004','https://images.unsplash.com/photo-1517254797898-04edd251bfb3?w=1200&q=80',0,'image'),
  ('b0000000-0000-0000-0000-000000000004','https://images.unsplash.com/photo-1559563458-527698bf5295?w=1200&q=80',1,'image'),

  ('b0000000-0000-0000-0000-000000000005','https://images.unsplash.com/photo-1614946975335-cb6cce5cfd0e?w=1200&q=80',0,'image'),
  ('b0000000-0000-0000-0000-000000000005','https://images.unsplash.com/photo-1627123424574-724758594e93?w=1200&q=80',1,'image'),

  ('b0000000-0000-0000-0000-000000000006','https://images.unsplash.com/photo-1517254797898-04edd251bfb3?w=1200&q=80',0,'image'),
  ('b0000000-0000-0000-0000-000000000006','https://images.unsplash.com/photo-1559563458-527698bf5295?w=1200&q=80',1,'image'),

  ('b0000000-0000-0000-0000-000000000007','https://images.unsplash.com/photo-1572807767021-58a022e95f43?w=1200&q=80',0,'image'),
  ('b0000000-0000-0000-0000-000000000007','https://images.unsplash.com/photo-1606503825008-909a67e63c3d?w=1200&q=80',1,'image'),

  ('b0000000-0000-0000-0000-000000000008','https://images.unsplash.com/photo-1614946975335-cb6cce5cfd0e?w=1200&q=80',0,'image'),
  ('b0000000-0000-0000-0000-000000000008','https://images.unsplash.com/photo-1627123424574-724758594e93?w=1200&q=80',1,'image');

-- Product tabs (3 per product) — generated for all products
insert into public.product_tabs (product_id, title, content, display_style, sort_order)
select p.id, 'Details',
  E'• Full-grain leather, vegetable tanned\n• Hand-stitched with waxed linen thread\n• Hand-painted, burnished edges\n• Debossed AEROM wordmark\n• Develops a rich patina with use',
  'highlight', 0
from public.products p
where not exists (select 1 from public.product_tabs t where t.product_id = p.id and t.title = 'Details');

insert into public.product_tabs (product_id, title, content, display_style, sort_order)
select p.id, 'Materials & Care',
  E'• Italian full-grain leather\n• Wipe clean with a soft, dry cloth\n• Condition every 3–6 months with a neutral leather balm\n• Avoid prolonged exposure to water and direct sunlight\n• Store in the dust bag when not in use',
  'list', 1
from public.products p
where not exists (select 1 from public.product_tabs t where t.product_id = p.id and t.title = 'Materials & Care');

insert into public.product_tabs (product_id, title, content, display_style, sort_order)
select p.id, 'Shipping & Returns',
  E'Free delivery on orders over ৳3000. Dhaka delivery in 1–2 business days, outside Dhaka in 3–5 days. Easy 7-day exchange — the wallet must be unused and in its original packaging.',
  'text', 2
from public.products p
where not exists (select 1 from public.product_tabs t where t.product_id = p.id and t.title = 'Shipping & Returns');

-- Product FAQs (4 per product)
insert into public.product_faqs (product_id, question, answer, sort_order)
select p.id, 'Is the leather genuine?',
  'Yes. Every AEROM wallet is made from full-grain Italian leather — the highest grade of natural leather, untouched by surface coatings.', 0
from public.products p
where not exists (select 1 from public.product_faqs f where f.product_id = p.id and f.question = 'Is the leather genuine?');

insert into public.product_faqs (product_id, question, answer, sort_order)
select p.id, 'How long will it last?',
  'With normal use and occasional conditioning, an AEROM wallet is built to last 8–10 years and only get better with age.', 1
from public.products p
where not exists (select 1 from public.product_faqs f where f.product_id = p.id and f.question = 'How long will it last?');

insert into public.product_faqs (product_id, question, answer, sort_order)
select p.id, 'Do you offer gift packaging?',
  'Every order ships in a linen-lined AEROM box with a dust bag and a hand-written care card — gift-ready by default.', 2
from public.products p
where not exists (select 1 from public.product_faqs f where f.product_id = p.id and f.question = 'Do you offer gift packaging?');

insert into public.product_faqs (product_id, question, answer, sort_order)
select p.id, 'What is your return policy?',
  '7-day easy returns or exchange. The wallet must be unused and in its original packaging. We cover return shipping inside Dhaka.', 3
from public.products p
where not exists (select 1 from public.product_faqs f where f.product_id = p.id and f.question = 'What is your return policy?');

-- Reviews (3 per product)
insert into public.reviews (product_id, customer_name, rating, comment) 
select p.id, x.name, x.rating, x.comment from public.products p
cross join (values
  ('Rafiul H.', 5, 'Beautiful craftsmanship. The leather smells incredible and feels premium in hand. Already getting compliments.'),
  ('Nabila K.', 5, 'Bought this as a gift for my husband — the packaging alone was worth it. He uses it every single day.'),
  ('Tanvir A.', 4, 'Slim, well-stitched, and exactly as pictured. Took one star off only because delivery took an extra day.')
) as x(name, rating, comment)
where not exists (select 1 from public.reviews r where r.product_id = p.id and r.customer_name = x.name);

-- Testimonials
insert into public.testimonials (name, review, rating, image_url, sort_order) values
  ('Imran S.', 'AEROM''s Heritage Bifold is the best wallet I''ve ever owned. The patina after six months is unreal.', 5, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80', 0),
  ('Sumaiya R.', 'Gifted the Gift Box to my brother — the presentation was hotel-suite quality. He hasn''t switched wallets since.', 5, 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80', 1),
  ('Arif M.', 'The Minimalist Cardholder lives in my front pocket and I forget it''s there. Exactly what I wanted.', 5, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80', 2),
  ('Nusrat J.', 'Premium leather, premium feel, fair price. AEROM is the rare local brand that competes with the imports.', 5, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80', 3)
on conflict do nothing;

-- Home FAQs
insert into public.home_faqs (question, answer, sort_order) values
  ('What kind of leather do you use?', 'Full-grain Italian leather, vegetable tanned — the highest grade of natural leather, free of surface coatings.', 0),
  ('Do you ship across Bangladesh?', 'Yes. We deliver nationwide. Dhaka in 1–2 business days, outside Dhaka in 3–5 business days. Cash on delivery available everywhere.', 1),
  ('Can I exchange or return a wallet?', '7-day easy returns and exchanges. The wallet must be unused and in its original packaging.', 2),
  ('How should I care for my AEROM wallet?', 'Wipe with a soft dry cloth and condition every 3–6 months with a neutral leather balm. Avoid water and direct sunlight.', 3),
  ('Do you offer corporate or bulk orders?', 'Yes. Reach out via WhatsApp or our contact form for custom debossing and bulk pricing.', 4)
on conflict do nothing;

-- Why choose us cards
insert into public.why_choose_us_cards (title, description, icon_name, sort_order) values
  ('Full-Grain Leather', 'Only the top layer of premium Italian hides — built to age beautifully.', 'Award', 0),
  ('Hand-Stitched', 'Saddle-stitched by hand with waxed linen thread for a stitch that won''t unravel.', 'Scissors', 1),
  ('Lifetime Patina', 'Designed to soften, darken, and tell your story over years of use.', 'Clock', 2),
  ('Cash on Delivery', 'Pay when it arrives. Nationwide COD on every order.', 'Truck', 3)
on conflict do nothing;

-- Hero slide
insert into public.hero_slides (id, image_url, title, subtitle, button_text, button_link, enabled, sort_order) values
  ('c0000000-0000-0000-0000-000000000001','https://images.unsplash.com/photo-1627123424574-724758594e93?w=1920&q=85',
   'Designed for Modern Carry','Hand-stitched full-grain leather wallets, built to last a lifetime.',
   'Shop the Collection','/shop', true, 0)
on conflict (id) do nothing;

-- Featured categories on homepage
insert into public.featured_categories (id, title, category_id, image_url, enabled, sort_order) values
  ('d0000000-0000-0000-0000-000000000001','Bifold Wallets','a1111111-1111-1111-1111-111111111101','https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&q=80', true, 0),
  ('d0000000-0000-0000-0000-000000000002','Cardholders','a1111111-1111-1111-1111-111111111102','https://images.unsplash.com/photo-1559563458-527698bf5295?w=800&q=80', true, 1),
  ('d0000000-0000-0000-0000-000000000003','Long Wallets','a1111111-1111-1111-1111-111111111103','https://images.unsplash.com/photo-1606503825008-909a67e63c3d?w=800&q=80', true, 2),
  ('d0000000-0000-0000-0000-000000000004','Money Clips','a1111111-1111-1111-1111-111111111104','https://images.unsplash.com/photo-1517254797898-04edd251bfb3?w=800&q=80', true, 3)
on conflict (id) do nothing;

-- Settings defaults (only if singletons exist)
update public.shop_settings set
  card_cta_mode = 'view_details',
  card_show_add_to_cart = true,
  card_show_view_details = true,
  card_show_buy_now = true,
  pdp_show_why_choose_us = true,
  pdp_show_shipment_details = true,
  default_sorting = 'newest'
where id = 'default';

update public.footer_settings set
  store_name = 'AEROM',
  description = 'Premium leather wallets, handcrafted for modern carry.',
  email = 'hello@aerombd.com',
  phone = '+880 1700-000000',
  address = 'Dhaka, Bangladesh',
  copyright_text = '© {year} AEROM. All rights reserved.'
where id = 'default';

update public.contact_settings set
  page_title = 'Get in touch',
  page_intro = 'Questions, custom orders, or wholesale — we''d love to hear from you.',
  email_address = 'hello@aerombd.com',
  phone_number = '+880 1700-000000',
  business_address = 'Dhaka, Bangladesh',
  show_address = true
where id = 'default';

update public.invoice_settings set
  store_name = 'AEROM',
  store_address = 'Dhaka, Bangladesh',
  store_phone = '+880 1700-000000',
  store_email = 'hello@aerombd.com',
  footer_note = 'Thank you for choosing AEROM.',
  signature_label = 'Authorised signature'
where id = 'default';
