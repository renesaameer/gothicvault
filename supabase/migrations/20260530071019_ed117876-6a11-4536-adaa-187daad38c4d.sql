
-- Footer settings
INSERT INTO footer_settings (id, store_name, description, email, phone, address, copyright_text, social_links, quick_links, customer_care_links, newsletter_enabled)
VALUES (
  'default',
  'MaverickMist',
  'Feminine luxury fragrances crafted for the modern woman. Romantic, elegant, unforgettable.',
  'hello@maverickmist.com',
  '+880 1700 000000',
  'Gulshan Avenue, Dhaka, Bangladesh',
  '© {year} MaverickMist. All rights reserved.',
  '[{"platform":"Instagram","url":"https://instagram.com","enabled":true},{"platform":"Facebook","url":"https://facebook.com","enabled":true},{"platform":"TikTok","url":"https://tiktok.com","enabled":true}]'::jsonb,
  '[{"label":"Shop","url":"/shop"},{"label":"About","url":"/about"},{"label":"Contact","url":"/contact"},{"label":"Track Order","url":"/track-order"}]'::jsonb,
  '[{"label":"Shipping","url":"/policies"},{"label":"Returns","url":"/policies"},{"label":"Privacy","url":"/policies"},{"label":"Terms","url":"/policies"}]'::jsonb,
  true
)
ON CONFLICT (id) DO UPDATE SET
  store_name = EXCLUDED.store_name,
  description = EXCLUDED.description,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  address = EXCLUDED.address,
  copyright_text = EXCLUDED.copyright_text,
  social_links = EXCLUDED.social_links,
  quick_links = EXCLUDED.quick_links,
  customer_care_links = EXCLUDED.customer_care_links;

-- Shop settings
INSERT INTO shop_settings (id, default_sorting, sorting_enabled, search_enabled, card_cta_mode)
VALUES ('default', 'featured', true, true, 'view_details')
ON CONFLICT (id) DO NOTHING;

-- Announcement bar
INSERT INTO announcement_bar (id, text, link, bg_color, text_color, enabled, dismissible)
VALUES ('default', 'Free luxury gift wrap on every order ✿ Complimentary shipping over ৳3,000', '/shop', '#D8B4A0', '#FFFDFC', true, true)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, bg_color = EXCLUDED.bg_color, text_color = EXCLUDED.text_color, enabled = true;

-- Categories
INSERT INTO categories (id, name, slug, sort_order, enabled) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Floral', 'floral', 1, true),
  ('22222222-2222-2222-2222-222222222222', 'Oriental', 'oriental', 2, true),
  ('33333333-3333-3333-3333-333333333333', 'Fresh', 'fresh', 3, true)
ON CONFLICT (id) DO NOTHING;

-- Products
INSERT INTO products (id, name, slug, short_description, description, category_id, price, sale_price, base_price, stock, rating, review_count, featured, best_seller, status, sort_order) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'Velvet Bloom', 'velvet-bloom',
   'A romantic bouquet of pink peony and Bulgarian rose.',
   'Velvet Bloom opens with sparkling pear and pink pepper, blooming into a heart of Bulgarian rose, peony and jasmine, drying down to creamy sandalwood and white musk. An everyday signature for the romantic woman.',
   '11111111-1111-1111-1111-111111111111', 4500, 3800, 4500, 25, 4.9, 128, true, true, 'active', 1),
  ('a0000002-0000-0000-0000-000000000002', 'Midnight Petals', 'midnight-petals',
   'Smoky orchid, oud and dark plum for evenings to remember.',
   'A bewitching oriental: black plum and saffron melt into orchid, Turkish rose and oud, closing on smoked vanilla and amber. Made for the woman who turns heads after dark.',
   '22222222-2222-2222-2222-222222222222', 5800, NULL, 5800, 18, 4.8, 96, true, true, 'active', 2),
  ('a0000003-0000-0000-0000-000000000003', 'Rose Eclipse', 'rose-eclipse',
   'Damascene rose petals on a bed of velvety musk.',
   'Rose Eclipse is pure romance — fresh-cut Damascene rose with hints of lychee and raspberry, held by powdery iris and creamy musk. A modern feminine classic.',
   '11111111-1111-1111-1111-111111111111', 4900, 4200, 4900, 30, 4.9, 142, true, false, 'active', 3),
  ('a0000004-0000-0000-0000-000000000004', 'Amber Whisper', 'amber-whisper',
   'Warm amber, honey and tonka — soft, addictive, magnetic.',
   'A whisper of golden amber wrapped around honey, tonka bean and benzoin. Slow-burning warmth that lingers on skin for hours.',
   '22222222-2222-2222-2222-222222222222', 5200, NULL, 5200, 22, 4.7, 84, false, true, 'active', 4),
  ('a0000005-0000-0000-0000-000000000005', 'Satin Aura', 'satin-aura',
   'Silky white tea, freesia and cashmere musk.',
   'Light, polished and serene — white tea and freesia meet a cashmere musk drydown. A modern aura for daily wear.',
   '33333333-3333-3333-3333-333333333333', 3800, 3200, 3800, 40, 4.6, 71, true, false, 'active', 5),
  ('a0000006-0000-0000-0000-000000000006', 'Lunar Vanilla', 'lunar-vanilla',
   'Madagascan vanilla, almond milk and warm sandalwood.',
   'Soft-spoken, comforting vanilla with creamy almond milk, coconut blossom and a sandalwood close. Like cashmere on skin.',
   '22222222-2222-2222-2222-222222222222', 4400, NULL, 4400, 28, 4.8, 109, false, true, 'active', 6),
  ('a0000007-0000-0000-0000-000000000007', 'Golden Veil', 'golden-veil',
   'Champagne accord, neroli and gilded amber.',
   'Effervescent champagne and bergamot lift a heart of neroli and orange blossom, settling into gilded amber and white woods. Pure opulence.',
   '22222222-2222-2222-2222-222222222222', 6200, 5400, 6200, 15, 4.9, 67, true, false, 'active', 7)
ON CONFLICT (id) DO NOTHING;

-- Product media
INSERT INTO product_media (product_id, image_url, alt_text, type, sort_order) VALUES
  ('a0000001-0000-0000-0000-000000000001', '/perfume/velvet-bloom.jpg',  'Velvet Bloom perfume bottle',  'image', 0),
  ('a0000002-0000-0000-0000-000000000002', '/perfume/midnight-petals.jpg','Midnight Petals perfume bottle','image', 0),
  ('a0000003-0000-0000-0000-000000000003', '/perfume/rose-eclipse.jpg',  'Rose Eclipse perfume bottle',  'image', 0),
  ('a0000004-0000-0000-0000-000000000004', '/perfume/amber-whisper.jpg', 'Amber Whisper perfume bottle', 'image', 0),
  ('a0000005-0000-0000-0000-000000000005', '/perfume/satin-aura.jpg',    'Satin Aura perfume bottle',    'image', 0),
  ('a0000006-0000-0000-0000-000000000006', '/perfume/lunar-vanilla.jpg', 'Lunar Vanilla perfume bottle', 'image', 0),
  ('a0000007-0000-0000-0000-000000000007', '/perfume/golden-veil.jpg',   'Golden Veil perfume bottle',   'image', 0);

-- Hero slide
INSERT INTO hero_slides (image_url, title, subtitle, button_text, button_link, enabled, sort_order) VALUES
  ('/perfume/hero.jpg',
   'Fragrance That You Love',
   'Discover the new MaverickMist collection — feminine luxury, bottled.',
   'Shop the Collection',
   '/shop',
   true, 1);

-- Featured categories
INSERT INTO featured_categories (category_id, title, image_url, enabled, sort_order) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Floral', '/perfume/rose-eclipse.jpg',  true, 1),
  ('22222222-2222-2222-2222-222222222222', 'Oriental','/perfume/midnight-petals.jpg', true, 2),
  ('33333333-3333-3333-3333-333333333333', 'Fresh',  '/perfume/satin-aura.jpg',    true, 3);

-- Testimonials
INSERT INTO testimonials (name, review, rating, image_url, sort_order) VALUES
  ('Anika R.',  'Velvet Bloom is my everyday signature. I get compliments every single time I wear it.', 5, '', 1),
  ('Tasnim H.', 'Beautifully packaged, beautifully scented. MaverickMist feels like proper luxury.',     5, '', 2),
  ('Ifrah K.',  'Midnight Petals is unreal — sophisticated, sultry, lasts all evening.',                 5, '', 3);

-- Why choose us cards
INSERT INTO why_choose_us_cards (title, description, icon_name, sort_order) VALUES
  ('Long-Lasting Wear',     '12+ hour wear from our concentrated parfum formulations.',          'Sparkles', 1),
  ('Cruelty-Free',          'Never tested on animals. Vegan-friendly ingredients throughout.',   'Heart',    2),
  ('Luxury Packaging',      'Hand-finished bottles and signature gift boxes with every order.',  'Gift',     3),
  ('Free Discovery Sample', 'A complimentary sample with every order to find your next signature.', 'Star',   4);
