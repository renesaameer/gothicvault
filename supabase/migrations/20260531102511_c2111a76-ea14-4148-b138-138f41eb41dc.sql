-- =========================================================
-- GOTHIC VAULT — DEMO CONTENT SEED
-- =========================================================

-- Clear (tables confirmed empty, but keep safe for reruns of content-only rows)
DELETE FROM public.homepage_sections;

-- ===== CATEGORIES =====
INSERT INTO public.categories (id, name, slug, sort_order, enabled, image_url) VALUES
  ('11111111-0000-0000-0000-000000000001'::uuid, 'Rings',                'rings',                1, true, 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80'),
  ('11111111-0000-0000-0000-000000000002'::uuid, 'Necklaces',            'necklaces',            2, true, 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80'),
  ('11111111-0000-0000-0000-000000000003'::uuid, 'Crosses & Pendants',   'crosses-pendants',     3, true, 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=80'),
  ('11111111-0000-0000-0000-000000000004'::uuid, 'Velvet & Chains',      'velvet-chains',        4, true, 'https://images.unsplash.com/photo-1620625515032-6ed0c1790c75?w=800&q=80')
ON CONFLICT (id) DO NOTHING;

-- ===== PRODUCTS =====
INSERT INTO public.products (id, name, slug, description, short_description, price, sale_price, base_price, category_id, stock, featured, best_seller, is_new_arrival, sort_order, status, sku) VALUES
  ('22222222-0000-0000-0000-000000000001'::uuid, 'Obsidian Moon Signet Ring', 'obsidian-moon-signet-ring', 'A weighted sterling silver signet ring engraved with a waning crescent. Hand-finished with an oxidised antique patina.', 'Engraved silver signet with crescent moon.', 2890, 2390, 2890, '11111111-0000-0000-0000-000000000001'::uuid, 25, true, true, true, 1, 'active', 'GV-RING-001'),
  ('22222222-0000-0000-0000-000000000002'::uuid, 'Thorn Crown Stacking Ring', 'thorn-crown-stacking-ring', 'Delicate barbed silver band with miniature thorn details. Wear alone or stack across knuckles.', 'Silver thorn band — stack or solo.', 1690, NULL, 1690, '11111111-0000-0000-0000-000000000001'::uuid, 40, true, false, true, 2, 'active', 'GV-RING-002'),
  ('22222222-0000-0000-0000-000000000003'::uuid, 'Cathedral Cross Pendant', 'cathedral-cross-pendant', 'Architectural silver cross with a faceted amethyst centre stone, hung on a 60cm box chain.', 'Silver cross + amethyst centre.', 3490, 2990, 3490, '11111111-0000-0000-0000-000000000003'::uuid, 18, true, true, false, 3, 'active', 'GV-CROSS-001'),
  ('22222222-0000-0000-0000-000000000004'::uuid, 'Raven Skull Choker', 'raven-skull-choker', 'Black velvet ribbon choker with a cast pewter raven skull centrepiece and silver chain accents.', 'Velvet + pewter raven choker.', 2190, NULL, 2190, '11111111-0000-0000-0000-000000000004'::uuid, 30, true, true, false, 4, 'active', 'GV-CHK-001'),
  ('22222222-0000-0000-0000-000000000005'::uuid, 'Eternal Vow Layered Necklace', 'eternal-vow-layered-necklace', 'Three-tier silver chain necklace with crystal drop and dagger charms. Adjustable to 18–22 inches.', 'Triple-layer silver dagger drop.', 3990, 3290, 3990, '11111111-0000-0000-0000-000000000002'::uuid, 22, true, false, true, 5, 'active', 'GV-NECK-001'),
  ('22222222-0000-0000-0000-000000000006'::uuid, 'Pentacle Sigil Ring', 'pentacle-sigil-ring', 'Heavy chrome ring engraved with a five-point sigil and surrounding latin script.', 'Chrome sigil statement ring.', 2490, NULL, 2490, '11111111-0000-0000-0000-000000000001'::uuid, 28, false, true, false, 6, 'active', 'GV-RING-003'),
  ('22222222-0000-0000-0000-000000000007'::uuid, 'Velvet Rose Hand Chain', 'velvet-rose-hand-chain', 'Burgundy velvet band joined to a silver bracelet by twin rose-cast clasps.', 'Velvet + silver hand chain.', 1890, 1590, 1890, '11111111-0000-0000-0000-000000000004'::uuid, 35, false, true, true, 7, 'active', 'GV-HAND-001'),
  ('22222222-0000-0000-0000-000000000008'::uuid, 'Midnight Cathedral Pendant', 'midnight-cathedral-pendant', 'Hand-cut amethyst crystal pendant set in a chrome gothic frame on a fine chain.', 'Amethyst + chrome gothic pendant.', 2790, NULL, 2790, '11111111-0000-0000-0000-000000000003'::uuid, 20, false, false, true, 8, 'active', 'GV-PEND-001')
ON CONFLICT (id) DO NOTHING;

-- ===== PRODUCT MEDIA =====
INSERT INTO public.product_media (product_id, image_url, sort_order) VALUES
  ('22222222-0000-0000-0000-000000000001'::uuid, 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=900&q=80', 0),
  ('22222222-0000-0000-0000-000000000002'::uuid, 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=900&q=80', 0),
  ('22222222-0000-0000-0000-000000000003'::uuid, 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=900&q=80', 0),
  ('22222222-0000-0000-0000-000000000004'::uuid, 'https://images.unsplash.com/photo-1620625515032-6ed0c1790c75?w=900&q=80', 0),
  ('22222222-0000-0000-0000-000000000005'::uuid, 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=900&q=80', 0),
  ('22222222-0000-0000-0000-000000000006'::uuid, 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=900&q=80', 0),
  ('22222222-0000-0000-0000-000000000007'::uuid, 'https://images.unsplash.com/photo-1622434641406-a158123450f9?w=900&q=80', 0),
  ('22222222-0000-0000-0000-000000000008'::uuid, 'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=900&q=80', 0);

-- ===== HERO SLIDES =====
INSERT INTO public.hero_slides (title, subtitle, button_text, button_link, image_url, sort_order, enabled) VALUES
  ('Enter the Vault', 'Hand-forged silver, velvet, and crystal — for the elegant underground.', 'Shop the Collection', '/shop', 'https://images.unsplash.com/photo-1518152006812-edab29b069ac?w=2000&q=80', 1, true),
  ('Ritual & Refinement', 'Occult-inspired accessories cast in chrome and oxidised silver.', 'Discover Rings', '/shop?category=Rings', 'https://images.unsplash.com/photo-1543699936-c901ddbf0c05?w=2000&q=80', 2, true);

-- ===== HOMEPAGE SECTIONS =====
INSERT INTO public.homepage_sections (id, content, enabled, sort_order) VALUES
  ('hero', '{"autoplay": true, "autoplay_speed": 6500}'::jsonb, true, 0),
  ('featured', '{"section_title": "Featured Relics", "subtitle": "Hand-picked pieces from the latest collection."}'::jsonb, true, 1),
  ('categories_showcase', '{"section_title": "Walk the Vault", "subtitle": "Shop by ritual category."}'::jsonb, true, 2),
  ('bestsellers', '{"section_title": "The Coveted", "subtitle": "Our most worn — silver, crystal, velvet."}'::jsonb, true, 3),
  ('brand_story', '{"title": "Born of Shadow & Silver", "text": "Gothic Vault is a quiet rebellion against the ordinary. Every piece is hand-finished in small batches — oxidised silver, hand-cut crystal, deep velvet — designed for those who carry their own darkness with elegance.", "button_text": "Read Our Story", "button_link": "/about", "image": "https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=1200&q=80"}'::jsonb, true, 4),
  ('why_choose_us', '{"section_title": "The Vault Standard", "subtitle": "Why our circle keeps coming back."}'::jsonb, true, 5),
  ('testimonials', '{"section_title": "Whispers from the Coven", "subtitle": "Worn by our community."}'::jsonb, true, 6),
  ('faq', '{"section_title": "Asked of the Vault", "subtitle": "Everything you may want to know."}'::jsonb, true, 7),
  ('newsletter', '{"title": "Join the Inner Circle", "subtitle": "Early access to drops, rituals, and members-only relics.", "placeholder": "your.shadow@email.com", "button_text": "Enter the Vault", "footnote": "No spells in your inbox — just new arrivals."}'::jsonb, true, 8);

-- ===== FEATURED CATEGORIES =====
INSERT INTO public.featured_categories (category_id, title, image_url, sort_order, enabled) VALUES
  ('11111111-0000-0000-0000-000000000001'::uuid, 'Rings',              'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80', 1, true),
  ('11111111-0000-0000-0000-000000000003'::uuid, 'Crosses & Pendants', 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=80', 2, true),
  ('11111111-0000-0000-0000-000000000002'::uuid, 'Necklaces',          'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80', 3, true),
  ('11111111-0000-0000-0000-000000000004'::uuid, 'Velvet & Chains',    'https://images.unsplash.com/photo-1620625515032-6ed0c1790c75?w=800&q=80', 4, true);

-- ===== WHY CHOOSE US =====
INSERT INTO public.why_choose_us_cards (title, description, icon_name, sort_order) VALUES
  ('Hand-Forged Silver',     'Every piece struck and finished by hand in small batches.', 'Hammer', 1),
  ('Crystal Cut to Order',   'Amethyst and quartz hand-selected for each setting.',       'Gem',     2),
  ('Shadow-Sealed Packaging','Velvet-lined boxes worthy of the relic inside.',            'Package', 3),
  ('Lifetime Re-blackening', 'We re-oxidise your silver, on us, forever.',                'Shield',  4);

-- ===== TESTIMONIALS =====
INSERT INTO public.testimonials (name, review, rating, sort_order, image_url) VALUES
  ('Lyra V.',   'The signet ring feels like it has been mine for years. The patina is unreal.', 5, 1, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80'),
  ('Mira K.',   'Velvet choker is heavier and finer than the photos. It''s become my signature.', 5, 2, 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80'),
  ('Ash N.',    'The cross pendant catches every light. Worth every taka.', 5, 3, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80'),
  ('Selene R.', 'Packaging alone was a ritual to open. Pieces inside even more so.', 5, 4, 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&q=80');

-- ===== HOME FAQS =====
INSERT INTO public.home_faqs (question, answer, sort_order) VALUES
  ('Are all pieces real sterling silver?', 'Yes — every ring, chain, and pendant is solid sterling silver (925) unless explicitly labelled as pewter or chrome.', 1),
  ('How is the silver darkened?',          'We use a traditional sulphur-based patina, hand-rubbed back to leave highlights raised and shadows deep. It will mellow further with wear.', 2),
  ('Where do you ship?',                   'All across Bangladesh with cash on delivery. International shipping is opening soon.', 3),
  ('Do you take custom commissions?',      'Yes — message us on WhatsApp with your concept. Most custom pieces ship within 3–4 weeks.', 4),
  ('How do I care for my piece?',          'Store in the velvet pouch provided. Avoid prolonged water contact and harsh chemicals to preserve the patina.', 5);

-- ===== ABOUT SECTIONS =====
INSERT INTO public.about_sections (id, content, enabled, sort_order) VALUES
  ('header',         '{"title": "About Gothic Vault", "intro": "A dark luxury accessories house born in the candle-lit corners of Dhaka."}'::jsonb, true, 0),
  ('story',          '{"headline": "Born of Shadow & Silver", "text": "Gothic Vault began as a private workshop — a single bench, one hammer, a small crucible. We were tired of mass-cast jewellery without weight, history, or intent. So we cast our own.\n\nEvery piece in the Vault is finished by hand: oxidised, polished back, and quality-checked under candlelight before it ever leaves the studio. Our circle is small — and that''s the point.", "image": "https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=1200&q=80"}'::jsonb, true, 1),
  ('mission_vision', '{"mission": "To make hand-forged gothic luxury accessible — pieces that feel inherited, not bought.", "vision": "A global coven of collectors who wear their darkness with quiet elegance."}'::jsonb, true, 2),
  ('values',         '{"cards": [{"title": "Craft", "description": "Hand-finished, never mass-cast.", "icon": "Hammer"}, {"title": "Patina", "description": "Time-darkened silver, alive with character.", "icon": "Sparkles"}, {"title": "Ritual", "description": "Every piece arrives in a sealed velvet vault.", "icon": "Package"}, {"title": "Circle", "description": "A small, devoted community of wearers.", "icon": "Heart"}]}'::jsonb, true, 3),
  ('cta',            '{"text": "Enter the Vault.", "button_text": "Shop the Collection", "button_link": "/shop"}'::jsonb, true, 4)
ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, enabled = EXCLUDED.enabled, sort_order = EXCLUDED.sort_order;

-- ===== POLICIES =====
INSERT INTO public.policies (slug, title, content, sort_order, enabled) VALUES
  ('shipping', 'Shipping & Delivery', E'## Shipping across Bangladesh\n\nWe ship from our Dhaka studio within **24–48 hours** of order confirmation.\n\n- **Inside Dhaka:** 1–2 business days\n- **Outside Dhaka:** 3–5 business days\n- **Cash on Delivery** available nationwide\n- **Free shipping** on orders above ৳3,000\n\nEvery piece ships in a sealed velvet vault box — handle it like the relic it is.', 1, true),
  ('returns',  'Returns & Exchanges', E'## A 7-day return window\n\nIf your piece doesn''t feel right, send it back within **7 days** of delivery for a refund or exchange.\n\n- Item must be unworn and in original packaging\n- Custom and engraved pieces are final sale\n- We cover return shipping on defects\n\nWrite to us at hello@gothicvault.shop to start a return.', 2, true),
  ('privacy',  'Privacy Policy',      E'## Your shadows are safe with us\n\nWe collect only what we need to fulfil your order: name, address, phone, and payment details.\n\n- Never sold, never shared with third parties\n- Used only for order processing and (if opted in) restock alerts\n- You can request deletion at any time\n\nQuestions? privacy@gothicvault.shop', 3, true),
  ('terms',    'Terms of Service',    E'## The fine print\n\nBy ordering from Gothic Vault you agree to:\n\n- Pricing displayed in **BDT (৳)** at checkout\n- Stock availability is final at the moment of payment confirmation\n- Pieces may show natural variation — patina, oxidation, and hand-finishing are intentional\n- Gothic Vault reserves the right to refuse service for fraudulent orders', 4, true);

-- ===== FOOTER SETTINGS =====
INSERT INTO public.footer_settings (id, store_name, description, email, phone, address, copyright_text, newsletter_enabled, quick_links, customer_care_links, social_links) VALUES
  ('default',
   'Gothic Vault',
   'Hand-forged silver, velvet, and crystal accessories for the elegant underground. Dhaka, Bangladesh.',
   'hello@gothicvault.shop',
   '+880 1700-000000',
   'Studio 13, Old Dhaka, Bangladesh',
   '© {year} Gothic Vault. All rites reserved.',
   true,
   '[{"label":"Shop","url":"/shop"},{"label":"About","url":"/about"},{"label":"Contact","url":"/contact"},{"label":"Track Order","url":"/track-order"}]'::jsonb,
   '[{"label":"Shipping","url":"/policies/shipping"},{"label":"Returns","url":"/policies/returns"},{"label":"Privacy","url":"/policies/privacy"},{"label":"Terms","url":"/policies/terms"}]'::jsonb,
   '[{"platform":"Instagram","url":"https://instagram.com/gothicvault","enabled":true},{"platform":"TikTok","url":"https://tiktok.com/@gothicvault","enabled":true},{"platform":"Pinterest","url":"https://pinterest.com/gothicvault","enabled":true}]'::jsonb
  )
ON CONFLICT (id) DO UPDATE SET
  store_name = EXCLUDED.store_name,
  description = EXCLUDED.description,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  address = EXCLUDED.address,
  copyright_text = EXCLUDED.copyright_text,
  newsletter_enabled = EXCLUDED.newsletter_enabled,
  quick_links = EXCLUDED.quick_links,
  customer_care_links = EXCLUDED.customer_care_links,
  social_links = EXCLUDED.social_links;

-- ===== CONTACT SETTINGS =====
INSERT INTO public.contact_settings (id, page_title, page_intro, email_address, phone_number, business_address, receiving_email, show_address, phone_field_enabled, submit_button_text, social_section_enabled, faq_shortcut_enabled, social_links) VALUES
  ('default',
   'Speak to the Vault',
   'Questions, custom commissions, or coven inquiries — we answer every message within 24 hours.',
   'hello@gothicvault.shop',
   '+880 1700-000000',
   'Studio 13, Old Dhaka, Bangladesh',
   'hello@gothicvault.shop',
   true, true,
   'Send the Summons',
   true, true,
   '[{"platform":"Instagram","url":"https://instagram.com/gothicvault","enabled":true},{"platform":"WhatsApp","url":"https://wa.me/8801700000000","enabled":true}]'::jsonb
  )
ON CONFLICT (id) DO UPDATE SET
  page_title = EXCLUDED.page_title,
  page_intro = EXCLUDED.page_intro,
  email_address = EXCLUDED.email_address,
  phone_number = EXCLUDED.phone_number,
  business_address = EXCLUDED.business_address,
  receiving_email = EXCLUDED.receiving_email,
  social_links = EXCLUDED.social_links,
  submit_button_text = EXCLUDED.submit_button_text;

-- ===== SHOP SETTINGS =====
INSERT INTO public.shop_settings (id, search_enabled, sorting_enabled, default_sorting, card_cta_mode, card_show_add_to_cart, card_show_buy_now, card_show_view_details, pdp_show_shipment_details, pdp_show_why_choose_us) VALUES
  ('default', true, true, 'newest', 'view_details', false, true, true, true, true)
ON CONFLICT (id) DO UPDATE SET
  search_enabled = EXCLUDED.search_enabled,
  sorting_enabled = EXCLUDED.sorting_enabled,
  default_sorting = EXCLUDED.default_sorting,
  card_cta_mode = EXCLUDED.card_cta_mode;

-- ===== ANNOUNCEMENT BAR =====
INSERT INTO public.announcement_bar (id, text, link, enabled, dismissible, bg_color, text_color) VALUES
  ('default', '✦ Free shipping inside Dhaka on orders above ৳3,000 ✦ Cash on delivery available nationwide ✦', '/shop', true, true, '#0a0710', '#e0d6f0')
ON CONFLICT (id) DO UPDATE SET
  text = EXCLUDED.text,
  link = EXCLUDED.link,
  enabled = EXCLUDED.enabled,
  bg_color = EXCLUDED.bg_color,
  text_color = EXCLUDED.text_color;
