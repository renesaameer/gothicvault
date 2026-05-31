
-- Update products: real names + generated images
UPDATE public.products SET name='Classic Bifold Wallet', slug='classic-bifold-wallet', short_description='The signature AEROM bifold. Hand-cut matte black leather.', description='Eight card slots, a long note compartment, and a hidden pocket — built from full-grain matte leather and finished by hand.', images=ARRAY['/products/classic-leather-wallet.jpg'] WHERE id='33333333-3333-3333-3333-333333333301';

UPDATE public.products SET name='Slim Bifold Cardholder', slug='slim-bifold-cardholder', short_description='Ultra-slim bifold for the essentials.', description='A pared-back bifold that holds up to eight cards and folded notes with zero bulk.', images=ARRAY['/products/bifold-cardholder.jpg'] WHERE id='33333333-3333-3333-3333-333333333302';

UPDATE public.products SET name='Heritage Card Holder', images=ARRAY['/products/heritage-card-holder.jpg'] WHERE id='33333333-3333-3333-3333-333333333303';

UPDATE public.products SET name='Money Clip Wallet', slug='money-clip-wallet', short_description='Slim leather card wallet with a brushed steel money clip.', description='Carry cards and folded notes in one quiet object. Brushed stainless clip, matte leather body.', images=ARRAY['/products/money-clip-wallet.jpg'] WHERE id='33333333-3333-3333-3333-333333333304';

UPDATE public.products SET name='Minimalist Card Sleeve', slug='minimalist-card-sleeve', short_description='A single-pocket sleeve for the daily three.', description='The smallest thing we make. Cut from one piece of leather, stitched by hand.', images=ARRAY['/products/card-sleeve.jpg'] WHERE id='33333333-3333-3333-3333-333333333305';

UPDATE public.products SET name='Premium Leather Belt', images=ARRAY['/products/leather-belt.jpg'] WHERE id='33333333-3333-3333-3333-333333333306';

-- Hero slides
INSERT INTO public.hero_slides (image_url, title, subtitle, button_text, button_link, sort_order, enabled) VALUES
('/hero/aerom-hero-1.jpg', 'Designed for modern carry.', 'The new AEROM bifold. Minimal by intention.', 'Shop the collection', '/shop', 0, true),
('/hero/aerom-hero-2.jpg', 'Precision in every detail.', 'Full-grain leather. Finished by hand.', 'Discover', '/shop', 1, true);

-- Featured categories
INSERT INTO public.featured_categories (category_id, title, image_url, sort_order, enabled) VALUES
('11111111-1111-1111-1111-111111111101', 'Wallets', '/categories/cat-wallets.jpg', 0, true),
('11111111-1111-1111-1111-111111111101', 'Cardholders', '/categories/cat-cardholders.jpg', 1, true),
('11111111-1111-1111-1111-111111111102', 'Belts', '/categories/cat-belts.jpg', 2, true);

-- About section image
INSERT INTO public.about_sections (id, content, sort_order, enabled) VALUES
('hero', jsonb_build_object('title', 'The craft of carry.', 'subtitle', 'AEROM is a study in restraint — full-grain leather, considered hardware, and the quiet patience of work done well.', 'image_url', '/about/aerom-craft.jpg'), 0, true)
ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, enabled = true;
