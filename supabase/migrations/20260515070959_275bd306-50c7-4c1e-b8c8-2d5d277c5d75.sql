
-- Update product images and content with locally generated assets
UPDATE products SET images = ARRAY['/products/emerald-bifold.jpg','/hero/hero-1.jpg','/about/about-story.jpg']
 WHERE id='33333333-3333-3333-3333-333333333301';
UPDATE products SET images = ARRAY['/products/onyx-cardholder.jpg','/hero/hero-3.jpg']
 WHERE id='33333333-3333-3333-3333-333333333302';
UPDATE products SET images = ARRAY['/products/heritage-long.jpg','/hero/hero-2.jpg','/about/about-hero.jpg']
 WHERE id='33333333-3333-3333-3333-333333333303';
UPDATE products SET images = ARRAY['/products/gold-money-clip.jpg']
 WHERE id='33333333-3333-3333-3333-333333333304';
UPDATE products SET images = ARRAY['/products/forest-trifold.jpg','/products/emerald-bifold.jpg']
 WHERE id='33333333-3333-3333-3333-333333333305';
UPDATE products SET images = ARRAY['/products/ivory-sleeve.jpg','/products/onyx-cardholder.jpg']
 WHERE id='33333333-3333-3333-3333-333333333306';

-- Update hero slides
UPDATE hero_slides SET image_url='/hero/hero-1.jpg' WHERE sort_order=1;
UPDATE hero_slides SET image_url='/hero/hero-2.jpg' WHERE sort_order=2;
UPDATE hero_slides SET image_url='/hero/hero-3.jpg' WHERE sort_order=3;

-- Update featured categories with proper imagery
UPDATE featured_categories SET image_url='/products/emerald-bifold.jpg' WHERE category_id='11111111-1111-1111-1111-111111111101';
UPDATE featured_categories SET image_url='/products/onyx-cardholder.jpg' WHERE category_id='11111111-1111-1111-1111-111111111102';
UPDATE featured_categories SET image_url='/products/heritage-long.jpg' WHERE category_id='11111111-1111-1111-1111-111111111103';

-- Update categories with images
UPDATE categories SET image_url='/products/emerald-bifold.jpg' WHERE id='11111111-1111-1111-1111-111111111101';
UPDATE categories SET image_url='/products/onyx-cardholder.jpg' WHERE id='11111111-1111-1111-1111-111111111102';
UPDATE categories SET image_url='/products/heritage-long.jpg' WHERE id='11111111-1111-1111-1111-111111111103';
UPDATE categories SET image_url='/products/gold-money-clip.jpg' WHERE id='11111111-1111-1111-1111-111111111104';

-- About sections imagery
UPDATE about_sections SET content = jsonb_set(content, '{image}', '"/about/about-hero.jpg"') WHERE id='hero';
UPDATE about_sections SET content = jsonb_set(content, '{image}', '"/about/about-story.jpg"') WHERE id='story';

-- Testimonials avatars (keep pravatar — clean external avatars)
-- (no change needed)

-- Refresh review counts in case rating columns were 0
UPDATE products p SET 
  review_count = (SELECT count(*) FROM reviews r WHERE r.product_id = p.id),
  rating = COALESCE((SELECT round(avg(rating)::numeric, 1) FROM reviews r WHERE r.product_id = p.id), p.rating);
