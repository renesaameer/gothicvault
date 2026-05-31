
-- Categories: add proper perfume images
UPDATE public.categories SET image_url = '/perfume/rose-eclipse.jpg', featured_image_url = '/perfume/rose-eclipse.jpg' WHERE slug = 'floral';
UPDATE public.categories SET image_url = '/perfume/midnight-petals.jpg', featured_image_url = '/perfume/midnight-petals.jpg' WHERE slug = 'oriental';
UPDATE public.categories SET image_url = '/perfume/satin-aura.jpg', featured_image_url = '/perfume/satin-aura.jpg' WHERE slug = 'fresh';

-- Homepage sections (content-only schema; enabled lives inside content)
INSERT INTO public.homepage_sections (id, title, content) VALUES
  ('featured', 'Featured', '{"enabled":true,"section_title":"Signature Collection","subtitle":"Editor''s pick of our most loved fragrances."}'::jsonb),
  ('bestsellers', 'Best Sellers', '{"enabled":true,"section_title":"Best Sellers","subtitle":"The scents our community keeps coming back for."}'::jsonb),
  ('categories_showcase', 'Categories', '{"enabled":true,"section_title":"Shop by Mood","subtitle":"Find a fragrance for every chapter."}'::jsonb),
  ('brand_story', 'Story', '{"enabled":true,"title":"The MaverickMist Story","text":"MaverickMist is a feminine luxury fragrance house, crafted in Bangladesh and inspired by the soft confidence of modern women. Every bottle is composed from premium oils and hand-blended in small batches — long-lasting, refined, and unmistakably yours.\n\nFrom delicate florals to warm orientals, we design scents that feel like a quiet kind of luxury — the kind you wear for yourself.","image":"/perfume/hero.jpg","button_text":"Discover the collection","button_link":"/shop"}'::jsonb),
  ('why_choose_us', 'Why Us', '{"enabled":true,"section_title":"Why MaverickMist","subtitle":"Crafted with intention, made to last."}'::jsonb),
  ('testimonials', 'Testimonials', '{"enabled":true,"section_title":"What Our Customers Say","subtitle":"Real stories from the MaverickMist community."}'::jsonb),
  ('video_reels', 'Reels', '{"enabled":true,"section_title":"Real Customer Experiences","subtitle":"See how our community wears MaverickMist."}'::jsonb),
  ('faq', 'FAQ', '{"enabled":true,"section_title":"Frequently Asked Questions","subtitle":"Everything you need to know before you buy."}'::jsonb),
  ('newsletter', 'Newsletter', '{"enabled":true,"title":"Join the MaverickMist Circle","subtitle":"Be the first to know about new launches, exclusive offers and scent edits.","button_text":"Subscribe","placeholder":"Enter your email","footnote":"No spam — only beautifully crafted updates."}'::jsonb)
ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, title = EXCLUDED.title, updated_at = now();

-- About page sections
INSERT INTO public.about_sections (id, enabled, sort_order, content) VALUES
  ('header', true, 1, '{"title":"About MaverickMist","intro":"A feminine luxury fragrance house designed for the modern woman."}'::jsonb),
  ('story', true, 2, '{"headline":"Our Story","image":"/perfume/hero.jpg","text":"MaverickMist was born from a simple idea — that every woman deserves a scent that feels like her own signature. Quietly luxurious, never loud.\n\nWe blend premium imported oils with delicate florals, warm musks and modern accords. Each fragrance is composed in small batches, aged for depth, and bottled by hand in Bangladesh."}'::jsonb),
  ('mission_vision', true, 3, '{"mission":"To craft long-lasting, refined fragrances that empower women to feel confident, feminine and unforgettable — without compromise on quality or price.","vision":"To become Bangladesh''s most loved luxury feminine fragrance house, known for soft elegance and uncompromising craft."}'::jsonb),
  ('founder', true, 4, '{"headline":"A Note From Our Founder","image":"/perfume/velvet-bloom.jpg","message":"MaverickMist began as a love letter to feminine luxury — a brand that feels intimate, intentional and beautifully made. Every bottle carries that promise.\n\n— Founder, MaverickMist"}'::jsonb),
  ('values', true, 5, '{"cards":[{"icon":"Sparkles","title":"Premium Oils","description":"Hand-selected imported fragrance oils for true longevity."},{"icon":"Heart","title":"Cruelty Free","description":"Never tested on animals — kindness is part of the craft."},{"icon":"Gem","title":"Luxury Packaging","description":"Weighted glass bottles and gift-ready presentation."},{"icon":"Leaf","title":"Small Batch","description":"Blended slowly, in small batches, for unmatched depth."}]}'::jsonb),
  ('cta', true, 6, '{"text":"Find your signature scent","button_text":"Shop the collection","button_link":"/shop"}'::jsonb)
ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, enabled = EXCLUDED.enabled, sort_order = EXCLUDED.sort_order, updated_at = now();

-- Contact settings default
INSERT INTO public.contact_settings (id, page_title, page_intro, phone_number, email_address, receiving_email, show_address, business_address, phone_field_enabled, submit_button_text, social_section_enabled, social_links, faq_shortcut_enabled, faq_shortcut_items, map_enabled)
VALUES (
  'default',
  'Get in Touch',
  'We''d love to hear from you. Reach out for orders, gifting or just to talk fragrance.',
  '+8801XXXXXXXXX',
  'hello@maverickmistbd.com',
  'hello@maverickmistbd.com',
  true,
  'Dhaka, Bangladesh',
  true,
  'Send Message',
  true,
  '[{"label":"Instagram","url":"https://instagram.com/maverickmist"},{"label":"Facebook","url":"https://facebook.com/maverickmist"},{"label":"TikTok","url":"https://tiktok.com/@maverickmist"}]'::jsonb,
  true,
  '[{"label":"How long do MaverickMist fragrances last?","url":"/policies/faq"},{"label":"What is your return policy?","url":"/policies/returns"},{"label":"Do you ship across Bangladesh?","url":"/policies/shipping"}]'::jsonb,
  false
)
ON CONFLICT (id) DO UPDATE SET
  page_title = EXCLUDED.page_title,
  page_intro = EXCLUDED.page_intro,
  phone_number = EXCLUDED.phone_number,
  email_address = EXCLUDED.email_address,
  receiving_email = EXCLUDED.receiving_email,
  business_address = EXCLUDED.business_address,
  social_section_enabled = EXCLUDED.social_section_enabled,
  social_links = EXCLUDED.social_links,
  faq_shortcut_enabled = EXCLUDED.faq_shortcut_enabled,
  faq_shortcut_items = EXCLUDED.faq_shortcut_items,
  updated_at = now();

-- Policies
INSERT INTO public.policies (slug, title, content, enabled, sort_order) VALUES
  ('shipping', 'Shipping Policy', '**Delivery Areas**

We deliver across Bangladesh through trusted courier partners including Pathao and Steadfast.

**Delivery Time**

Inside Dhaka: 1–2 business days
Outside Dhaka: 2–5 business days

**Delivery Charges**

Inside Dhaka: ৳60
Outside Dhaka: ৳120
Free shipping on orders above ৳3,000.

**Order Processing**

Orders placed before 5pm are processed the same day. We send a confirmation message before dispatch.', true, 1),
  ('returns', 'Return & Exchange', '**7-Day Easy Exchange**

We accept exchanges within 7 days of delivery for unopened, sealed bottles.

**Conditions**

- The bottle must be unused and in its original packaging
- The seal must be intact
- Proof of purchase is required

**How to Request**

WhatsApp us at +8801XXXXXXXXX or email hello@maverickmistbd.com with your order number and a short reason.

**Not Eligible**

Opened, used, or damaged bottles and free gift items are not eligible for return.', true, 2),
  ('refund', 'Refund Policy', '**Refund Eligibility**

Refunds are processed for verified damaged-in-transit cases or wrong items shipped.

**Process**

1. Reach out within 48 hours of delivery with photos
2. Our team verifies the issue within 1–2 business days
3. Refund is issued to your original payment method or via bKash within 5–7 business days

**Cash on Delivery**

For COD orders, refunds are issued via bKash or bank transfer.', true, 3),
  ('privacy', 'Privacy Policy', '**Information We Collect**

We collect only what we need to fulfill your order: name, phone, email, shipping address and order history.

**How We Use It**

- To process and deliver your orders
- To send order updates and (with consent) newsletters
- To improve our products and service

**Sharing**

We never sell your data. We only share necessary details with our courier partners for delivery.

**Your Rights**

You can request to view, update or delete your personal data at any time by emailing hello@maverickmistbd.com.', true, 4),
  ('terms', 'Terms & Conditions', '**Use of Our Website**

By using maverickmistbd.com you agree to these terms. We may update them from time to time.

**Pricing & Availability**

All prices are in BDT (৳) and include applicable taxes. We reserve the right to correct pricing errors and limit quantities.

**Orders**

Placing an order constitutes an offer; orders are confirmed once payment / COD is verified.

**Intellectual Property**

All product imagery, copy and branding belong to MaverickMist and may not be reproduced without permission.', true, 5),
  ('faq', 'FAQ', '**How long do MaverickMist perfumes last?**

Our eau de parfum concentrations typically last 6–10 hours depending on skin type and weather.

**Are your fragrances cruelty-free?**

Yes — we never test on animals.

**Do you ship outside Bangladesh?**

Currently we ship within Bangladesh only. International shipping is coming soon.

**Can I get a sample first?**

Yes, free discovery samples are included with every full-size order.', true, 6)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content, enabled = EXCLUDED.enabled, sort_order = EXCLUDED.sort_order, updated_at = now();
