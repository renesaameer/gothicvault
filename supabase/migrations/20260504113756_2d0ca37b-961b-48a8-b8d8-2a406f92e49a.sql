
-- Brand constants used below
-- Phone: +880 1700-000000 (placeholder, editable from admin)
-- WhatsApp: 8801700000000

-- 1) Design / Logos
INSERT INTO public.design_settings (id, logo_desktop_url, logo_mobile_url, logo_footer_url, favicon_url)
VALUES ('default', '/logo.png', '/logo.png', '/logo.png', '/favicon.png')
ON CONFLICT (id) DO UPDATE SET
  logo_desktop_url = EXCLUDED.logo_desktop_url,
  logo_mobile_url  = EXCLUDED.logo_mobile_url,
  logo_footer_url  = EXCLUDED.logo_footer_url,
  favicon_url      = EXCLUDED.favicon_url,
  updated_at = now();

-- 2) Footer
INSERT INTO public.footer_settings (id, store_name, description, email, phone, address, copyright_text, social_links, quick_links, customer_care_links, newsletter_enabled)
VALUES (
  'default',
  'Nupur Abaya And More',
  'Elegant modest fashion — abayas, khimars, sets and accessories crafted with quality fabrics and a focus on modest design.',
  'hello@nupurabaya.com',
  '+8801700000000',
  'Dhaka, Bangladesh',
  '© ' || date_part('year', now())::text || ' Nupur Abaya And More. All rights reserved.',
  '[
    {"platform":"instagram","url":"https://instagram.com/nupurabaya","label":"Instagram"},
    {"platform":"facebook","url":"https://facebook.com/nupurabaya","label":"Facebook"},
    {"platform":"whatsapp","url":"https://wa.me/8801700000000","label":"WhatsApp"}
  ]'::jsonb,
  '[
    {"label":"Shop","url":"/shop"},
    {"label":"About","url":"/about"},
    {"label":"Contact","url":"/contact"}
  ]'::jsonb,
  '[
    {"label":"Track Order","url":"/track-order"},
    {"label":"Policies","url":"/policies"}
  ]'::jsonb,
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
  customer_care_links = EXCLUDED.customer_care_links,
  newsletter_enabled = EXCLUDED.newsletter_enabled,
  updated_at = now();

-- 3) Contact page
INSERT INTO public.contact_settings (
  id, page_title, page_intro, phone_number, email_address, receiving_email,
  show_address, business_address, phone_field_enabled, submit_button_text,
  social_section_enabled, social_links, faq_shortcut_enabled, faq_shortcut_items, map_enabled
)
VALUES (
  'default',
  'Contact Us',
  'Have a question about an order or product? Reach out — we usually reply within a few hours.',
  '+8801700000000',
  'hello@nupurabaya.com',
  'hello@nupurabaya.com',
  true,
  'Dhaka, Bangladesh',
  true,
  'Send Message',
  true,
  '[
    {"platform":"instagram","url":"https://instagram.com/nupurabaya","label":"Instagram"},
    {"platform":"facebook","url":"https://facebook.com/nupurabaya","label":"Facebook"},
    {"platform":"whatsapp","url":"https://wa.me/8801700000000","label":"WhatsApp"}
  ]'::jsonb,
  false,
  '[]'::jsonb,
  false
)
ON CONFLICT (id) DO UPDATE SET
  page_title = EXCLUDED.page_title,
  page_intro = EXCLUDED.page_intro,
  phone_number = EXCLUDED.phone_number,
  email_address = EXCLUDED.email_address,
  receiving_email = EXCLUDED.receiving_email,
  business_address = EXCLUDED.business_address,
  social_links = EXCLUDED.social_links,
  updated_at = now();

-- 4) WhatsApp float
INSERT INTO public.whatsapp_settings (id, phone_number, enabled, radar_animation)
VALUES ('default', '8801700000000', true, true)
ON CONFLICT (id) DO UPDATE SET
  phone_number = EXCLUDED.phone_number,
  enabled = EXCLUDED.enabled,
  updated_at = now();

-- 5) Announcement bar
INSERT INTO public.announcement_bar (id, enabled, text, link, bg_color, text_color, dismissible)
VALUES ('default', true, 'Free delivery on orders over ৳3,000 across Bangladesh', '/shop', '#1a1a1a', '#c8a23a', true)
ON CONFLICT (id) DO UPDATE SET
  enabled = EXCLUDED.enabled,
  text = EXCLUDED.text,
  link = EXCLUDED.link,
  bg_color = EXCLUDED.bg_color,
  text_color = EXCLUDED.text_color,
  updated_at = now();

-- 6) Categories
INSERT INTO public.categories (name, slug, sort_order) VALUES
  ('Abayas', 'abayas', 1),
  ('Khimars', 'khimars', 2),
  ('Sets', 'sets', 3),
  ('Accessories', 'accessories', 4)
ON CONFLICT DO NOTHING;

-- 7) Hero slide
INSERT INTO public.hero_slides (sort_order, enabled, image_url, title, subtitle, button_text, button_link)
VALUES (1, true, '/logo.png', 'Elegant Modest Fashion for Every Occasion', 'Discover abayas, khimars and curated sets crafted for everyday grace.', 'Shop Now', '/shop');

-- 8) About policy
INSERT INTO public.policies (slug, title, content, enabled, sort_order)
VALUES (
  'about',
  'About Nupur Abaya And More',
  'Nupur Abaya And More is a modest fashion label offering abayas, khimars, coordinated sets and accessories. We focus on quality fabrics, considered fit and timeless design — pieces made to feel as elegant as they look.',
  true,
  1
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  enabled = EXCLUDED.enabled,
  updated_at = now();
