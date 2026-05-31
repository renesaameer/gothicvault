-- ============================================================================
-- 08 — Optional demo catalog (safe to skip or delete)
-- Uses /placeholder.svg for images. All inserts use deterministic UUIDs and
-- `on conflict do nothing`, so re-running never duplicates rows.
-- ============================================================================

insert into public.categories (id, name, slug, sort_order) values
  ('11111111-1111-1111-1111-111111111101','Leather Goods','leather-goods',1),
  ('11111111-1111-1111-1111-111111111102','Accessories','accessories',2),
  ('11111111-1111-1111-1111-111111111103','Silk & Scarves','silk-scarves',3)
on conflict (id) do nothing;

insert into public.brands (id, name, slug, sort_order) values
  ('22222222-2222-2222-2222-222222222201','SPEOS Signature','speos-signature',1)
on conflict (id) do nothing;

insert into public.delivery_zones (name, areas, shipping_cost, delivery_charge, free_shipping_threshold, free_delivery_minimum, estimated_days, sort_order) values
  ('Inside Dhaka', '["Dhaka"]'::jsonb, 60, 60, 3000, 3000, '1-2 days', 1),
  ('Outside Dhaka', '["Chattogram","Sylhet","Khulna","Rajshahi","Barishal","Rangpur","Mymensingh"]'::jsonb, 120, 120, 5000, 5000, '3-5 days', 2)
on conflict do nothing;

insert into public.products (id, name, slug, short_description, description, price, sale_price, stock, images, category_id, brand_id, featured, best_seller, sort_order) values
  ('33333333-3333-3333-3333-333333333301','Classic Leather Wallet','classic-leather-wallet','Hand-stitched bifold in full-grain leather','Timeless bifold wallet crafted from full-grain Italian leather. Designed to age beautifully.', 3500, 2999, 24, ARRAY['/placeholder.svg'], '11111111-1111-1111-1111-111111111101','22222222-2222-2222-2222-222222222201', true, true, 1),
  ('33333333-3333-3333-3333-333333333302','Signature Silk Scarf','signature-silk-scarf','100% mulberry silk, hand-rolled edges','Lightweight mulberry silk scarf with our signature print and hand-rolled hems.', 4200, null, 18, ARRAY['/placeholder.svg'], '11111111-1111-1111-1111-111111111103','22222222-2222-2222-2222-222222222201', true, false, 2),
  ('33333333-3333-3333-3333-333333333303','Heritage Card Holder','heritage-card-holder','Slim cardholder, six pockets','Slim profile cardholder in pebbled leather with six card slots and a center sleeve.', 1800, 1499, 40, ARRAY['/placeholder.svg'], '11111111-1111-1111-1111-111111111101','22222222-2222-2222-2222-222222222201', false, true, 3),
  ('33333333-3333-3333-3333-333333333304','Cashmere Wrap','cashmere-wrap','Oversized Mongolian cashmere','Generously sized cashmere wrap in a versatile neutral palette. Light, warm, packable.', 8500, null, 12, ARRAY['/placeholder.svg'], '11111111-1111-1111-1111-111111111103','22222222-2222-2222-2222-222222222201', true, false, 4),
  ('33333333-3333-3333-3333-333333333305','Brass Cufflinks','brass-cufflinks','Solid brass, gift-boxed','Solid polished brass cufflinks finished by hand and presented in a gift box.', 2200, null, 30, ARRAY['/placeholder.svg'], '11111111-1111-1111-1111-111111111102','22222222-2222-2222-2222-222222222201', false, false, 5),
  ('33333333-3333-3333-3333-333333333306','Premium Leather Belt','premium-leather-belt','Adjustable, full-grain','Full-grain leather belt with a solid metal buckle. Cut to size on order.', 2800, 2400, 22, ARRAY['/placeholder.svg'], '11111111-1111-1111-1111-111111111102','22222222-2222-2222-2222-222222222201', false, true, 6)
on conflict (id) do nothing;