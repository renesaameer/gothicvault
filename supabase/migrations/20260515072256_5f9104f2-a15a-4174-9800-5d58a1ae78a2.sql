
-- Homepage sections
INSERT INTO public.homepage_sections (id, sort_order, enabled, content) VALUES
('hero', 0, true, '{"autoplay": true, "autoplay_speed": 6000}'::jsonb),
('brand_story', 1, true, jsonb_build_object(
  'eyebrow', 'Our craft',
  'title', 'Heirloom leather, made by hand in Dhaka',
  'body', 'Every SPEOS wallet is cut, stitched and edge-burnished by a single artisan in our Banani workshop. We use only full-grain Italian leather and solid brass hardware — built to age beautifully for a decade or more.',
  'image', '/about/about-story.jpg',
  'button_text', 'Read our story',
  'button_link', '/about'
)),
('featured', 2, true, jsonb_build_object(
  'section_title', 'Featured Collection',
  'subtitle', 'Hand-picked essentials trusted by 5,000+ customers across Bangladesh.'
)),
('categories_showcase', 3, true, jsonb_build_object(
  'section_title', 'Shop by Category',
  'subtitle', 'Find the perfect everyday carry.'
)),
('bestsellers', 4, true, jsonb_build_object(
  'section_title', 'Best Sellers',
  'subtitle', 'The pieces our customers love most — restocked weekly.'
)),
('brands_showcase', 5, true, jsonb_build_object(
  'section_title', 'Our Houses',
  'subtitle', 'Two ateliers. One obsession with leather.'
)),
('testimonials', 6, true, jsonb_build_object(
  'section_title', 'Loved by Bangladesh',
  'subtitle', 'Real reviews from real SPEOS customers.'
)),
('why_choose_us', 7, true, jsonb_build_object(
  'section_title', 'Why SPEOS',
  'subtitle', 'Quiet luxury, built for daily life.'
)),
('faqs', 8, true, jsonb_build_object(
  'section_title', 'Frequently Asked',
  'subtitle', 'Quick answers to the questions we hear most.'
)),
('newsletter', 9, true, jsonb_build_object(
  'section_title', 'Join the SPEOS Atelier',
  'subtitle', 'Be the first to hear about new drops, restocks and members-only offers. No spam — ever.',
  'button_text', 'Subscribe',
  'placeholder', 'Your email address'
))
ON CONFLICT (id) DO UPDATE SET
  enabled = EXCLUDED.enabled,
  sort_order = EXCLUDED.sort_order,
  content = EXCLUDED.content,
  updated_at = now();

-- Contact: enable map + social, set Google Maps embed for Banani Dhaka
UPDATE public.contact_settings SET
  page_title = 'We''d love to hear from you',
  page_intro = 'Questions about a product, an order or a custom piece? Our team in Dhaka responds within a few hours, every day from 10 AM to 8 PM.',
  business_address = 'SPEOS Atelier' || E'\n' || 'House 21, Road 11, Banani' || E'\n' || 'Dhaka 1213, Bangladesh',
  show_address = true,
  phone_field_enabled = true,
  social_section_enabled = true,
  social_links = '[
    {"label":"Facebook","url":"https://facebook.com/speos","platform":"facebook"},
    {"label":"Instagram","url":"https://instagram.com/speos","platform":"instagram"},
    {"label":"WhatsApp","url":"https://wa.me/8801712345678","platform":"whatsapp"},
    {"label":"YouTube","url":"https://youtube.com/@speos","platform":"youtube"}
  ]'::jsonb,
  faq_shortcut_enabled = true,
  faq_shortcut_items = '[
    {"question":"How long does delivery take?","answer":"1–2 business days inside Dhaka and 2–4 days nationwide. We ship every weekday."},
    {"question":"Do you offer cash on delivery?","answer":"Yes — COD is available across all 64 districts of Bangladesh."},
    {"question":"Can I return or exchange a wallet?","answer":"Absolutely. Unused items can be returned within 7 days, and exchanges are free for 14 days."},
    {"question":"Is the leather authentic?","answer":"Every SPEOS wallet is made from full-grain Italian leather sourced from LWG-certified tanneries."}
  ]'::jsonb,
  map_enabled = true,
  map_embed = '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3651.967!2d90.4043!3d23.7937!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755c7a3f1d0a99b%3A0x123456789abcdef!2sBanani%2C+Dhaka!5e0!3m2!1sen!2sbd!4v1700000000000" width="100%" height="320" style="border:0;border-radius:14px;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>',
  updated_at = now()
WHERE id = 'default';

-- About: refresh content
UPDATE public.about_sections SET content = jsonb_build_object(
  'title', 'Crafted with intention',
  'subtitle', 'SPEOS — Sophisticated Premium Essentials for Outstanding Style',
  'intro', 'A small Dhaka atelier obsessed with the quiet art of leather. We design heirloom wallets that age with grace and serve you for decades — not seasons.',
  'body', 'Founded in Banani in 2022, SPEOS was born from a belief that everyday objects deserve to be made well, by hand, by people who care. Today we serve thousands of customers across Bangladesh who choose craft over trend.',
  'image', '/about/about-hero.jpg'
), enabled = true WHERE id = 'hero';

UPDATE public.about_sections SET content = jsonb_build_object(
  'headline', 'Our Story',
  'title', 'A bifold made for a friend',
  'text', 'It all started with a single bifold made for a friend. He carried it for two years and the leather only got better. Word spread. Friends became customers, customers became regulars, and SPEOS became a quiet movement of people who value craft over trend.' || E'\n\n' || 'Today every SPEOS piece is hand-stitched in our Banani workshop using full-grain leather from Italy''s most respected tanneries. We refuse to cut corners — even on the parts no one sees.',
  'image', '/about/about-story.jpg'
), enabled = true WHERE id = 'story';

INSERT INTO public.about_sections (id, sort_order, enabled, content) VALUES
('mission_vision', 2, true, jsonb_build_object(
  'mission', 'To prove that everyday luxury can be made in Bangladesh, by Bangladeshi hands, at a price that honours both the craftsman and the customer.',
  'vision', 'A world where the things you carry every day are made to last a lifetime — and tell a story worth telling.'
)),
('founder', 3, false, jsonb_build_object(
  'headline', 'A note from our founder',
  'message', 'Thank you for trusting us with the small object you''ll carry every day. We don''t take it lightly. — Arif H., Founder',
  'image', '/about/about-hero.jpg'
))
ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, enabled = EXCLUDED.enabled, sort_order = EXCLUDED.sort_order, updated_at = now();

UPDATE public.about_sections SET content = jsonb_build_object(
  'title', 'What we stand for',
  'cards', jsonb_build_array(
    jsonb_build_object('icon','Hammer','title','Craftsmanship','description','Every wallet is hand-cut, stitched and edge-burnished by a single artisan from start to finish.'),
    jsonb_build_object('icon','Leaf','title','Materials','description','Full-grain Italian leather, waxed linen thread and solid brass hardware. No corners cut.'),
    jsonb_build_object('icon','Shield','title','Longevity','description','Designed and warranted to last a decade or more under normal daily use.'),
    jsonb_build_object('icon','Heart','title','Care','description','Made by people who know your name. Returned with care. Worn with pride.')
  )
), enabled = true WHERE id = 'values';

UPDATE public.about_sections SET content = jsonb_build_object(
  'text', 'Carry something made to last',
  'button_text', 'Shop the collection',
  'button_link', '/shop'
), enabled = true WHERE id = 'cta';
