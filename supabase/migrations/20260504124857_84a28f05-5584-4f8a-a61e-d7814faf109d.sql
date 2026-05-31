
-- 1. Update footer with all menu + policy links
UPDATE public.footer_settings
SET
  quick_links = '[
    {"label":"Home","url":"/"},
    {"label":"Shop","url":"/shop"},
    {"label":"About","url":"/about"},
    {"label":"Contact","url":"/contact"},
    {"label":"Track Order","url":"/track-order"}
  ]'::jsonb,
  customer_care_links = '[
    {"label":"Shipping & Delivery","url":"/policies?tab=shipping"},
    {"label":"Returns & Exchange","url":"/policies?tab=returns"},
    {"label":"Privacy Policy","url":"/policies?tab=privacy"},
    {"label":"Terms & Conditions","url":"/policies?tab=terms"},
    {"label":"About Us","url":"/policies?tab=about"}
  ]'::jsonb,
  updated_at = now()
WHERE id = 'default';

-- 2. Enable About policy + write all policy contents (Bangladesh modest fashion store)
UPDATE public.policies SET enabled = true, updated_at = now() WHERE slug = 'about';

UPDATE public.policies SET content =
'At **Nupur Abaya And More**, we celebrate modest fashion that blends elegance with everyday comfort. From flowing abayas and graceful khimars to coordinated sets and finishing accessories, every piece is chosen to help the modern Muslimah feel confident, beautiful, and true to her values.

**Our Mission**
To make premium modest wear accessible to every woman across Bangladesh — combining quality fabrics, thoughtful tailoring, and timeless design at honest prices.

**What We Offer**
- Hand-picked abayas, khimars, hijabs, and modest sets
- Carefully curated accessories to complete every look
- Fast delivery across Bangladesh
- Cash on Delivery for your peace of mind
- Friendly customer support every day of the week

Thank you for being part of our journey. Every order means the world to us.', updated_at = now() WHERE slug = 'about';

UPDATE public.policies SET content =
'**Delivery Coverage**
We deliver across all 64 districts of Bangladesh through our trusted courier partners.

**Delivery Charges**
- Inside Dhaka: ৳60 – ৳80
- Outside Dhaka: ৳120 – ৳150
- Free shipping is available on orders above the threshold shown at checkout.

**Delivery Time**
- Inside Dhaka: 1–2 business days
- Outside Dhaka: 2–4 business days
- Remote areas may take an additional 1–2 days.

**Order Processing**
Orders placed before 5:00 PM are processed the same day. Orders placed after 5:00 PM, on Fridays, or on national holidays are processed the next working day.

**Tracking Your Order**
Once dispatched, you will receive an SMS with your tracking number. You can also track your order anytime from the **Track Order** page on our website.

**Failed Delivery**
If our courier is unable to reach you after multiple attempts, the parcel will be returned to us. Re-shipping will require an additional delivery charge.

For any delivery-related queries, please contact our support team via WhatsApp.', updated_at = now() WHERE slug = 'shipping';

UPDATE public.policies SET content =
'We want you to love every piece you order from **Nupur Abaya And More**. If something isn''t right, here''s how we can help.

**Eligibility for Return / Exchange**
- Request must be raised within **3 days** of receiving your order.
- Item must be **unused, unwashed**, with original tags and packaging intact.
- Item must show no signs of wear, perfume, or stains.

**Items Not Eligible**
- Inner wear, hijabs, and accessories (for hygiene reasons)
- Items bought during clearance or flash sale
- Custom-stitched or altered items

**How to Request**
1. Message us on WhatsApp with your order number and a clear photo/video of the issue.
2. Our team will review and confirm within 24 hours.
3. Once approved, ship the item back to our address (return courier charge is the customer''s responsibility unless the issue is from our side).

**Refunds & Exchanges**
- Wrong product or manufacturing defect: full refund or free replacement.
- Size exchange: subject to stock availability; one-time exchange only.
- Refunds are processed via bKash/Nagad within 3–5 working days after we receive and inspect the returned item.

We''re always here to help — your trust matters more than any single sale.', updated_at = now() WHERE slug = 'returns';

UPDATE public.policies SET content =
'**Nupur Abaya And More** ("we", "our", "us") respects your privacy. This policy explains what information we collect and how we use it.

**Information We Collect**
- **Personal info:** name, phone, address, email (only if provided) — needed to deliver your order.
- **Order info:** items purchased, payment method, delivery zone.
- **Browsing info:** pages visited, device type, and basic analytics through cookies and tracking pixels (Meta, Google, TikTok) to improve your shopping experience.

**How We Use Your Information**
- Process and deliver your orders
- Communicate order updates via SMS, call, or WhatsApp
- Improve our products and website
- Show relevant offers and recommendations

**Sharing Your Information**
We **never** sell your personal data. We share only the minimum required information with:
- Trusted courier partners (for delivery)
- Payment providers (for verifying payment)
- Marketing platforms (anonymised/hashed for ad performance only)

**Your Rights**
You may contact us anytime to:
- Review the data we hold about you
- Request correction or deletion of your data
- Unsubscribe from marketing messages

**Data Security**
We use industry-standard security practices to protect your information. However, no online transmission is 100% secure, and we cannot guarantee absolute security.

**Contact**
For any privacy-related concerns, reach us via the Contact page or WhatsApp.', updated_at = now() WHERE slug = 'privacy';

UPDATE public.policies SET content =
'By placing an order with **Nupur Abaya And More**, you agree to the following terms.

**Orders**
- All orders are subject to product availability.
- We reserve the right to cancel any order due to stock issues, suspected fraud, or incorrect customer information.
- Prices are listed in Bangladeshi Taka (৳) and include all applicable charges except delivery.

**Payment**
- We accept Cash on Delivery (COD), bKash, and Nagad.
- For COD, please keep the exact amount ready at the time of delivery.

**Product Information**
- We make every effort to display product colors, fabrics, and details accurately. Slight variation may occur due to screen settings or lighting.
- Sizes follow the size chart provided on each product page.

**Cancellation**
- Orders can be cancelled before they are dispatched by contacting us via WhatsApp.
- Once an order is shipped, cancellation is not possible.

**Intellectual Property**
All product images, text, and branding on this website belong to Nupur Abaya And More and may not be copied, reproduced, or used commercially without written permission.

**Liability**
We are not liable for any indirect or consequential losses arising from the use of our products or website.

**Changes to Terms**
We may update these terms at any time. Continued use of our website after changes constitutes acceptance of the updated terms.

**Governing Law**
These terms are governed by the laws of the People''s Republic of Bangladesh.', updated_at = now() WHERE slug = 'terms';

-- 3. Seed About page sections (table is empty)
INSERT INTO public.about_sections (id, enabled, sort_order, content) VALUES
('header', true, 1, '{
  "title": "About Nupur Abaya And More",
  "intro": "Modest wear crafted with love — for the modern Muslimah of Bangladesh."
}'::jsonb),
('story', true, 2, '{
  "headline": "Our Story",
  "image": "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=900&q=80&auto=format&fit=crop",
  "text": "Nupur Abaya And More began with a simple wish — to make beautiful, premium modest wear easy to find and easy to afford for women across Bangladesh.\n\nWhat started as a small home-run boutique has grown into a trusted destination for abayas, khimars, hijabs, and coordinated sets. Every piece in our collection is chosen with care, keeping in mind comfort, quality, and the timeless elegance that modest fashion deserves."
}'::jsonb),
('mission_vision', true, 3, '{
  "mission": "To bring premium-quality modest fashion within reach of every woman in Bangladesh — through honest pricing, thoughtful design, and reliable service.",
  "vision": "To become the most loved modest-wear destination in Bangladesh, where every Muslimah feels confident, beautiful, and at home."
}'::jsonb),
('founder', true, 4, '{
  "headline": "A Note From the Founder",
  "image": "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=700&q=80&auto=format&fit=crop",
  "message": "When I started Nupur Abaya And More, my dream was simple — to dress every sister in something that makes her feel graceful, modest, and proud.\n\nThank you for trusting us. Every order is packed with prayers and care. This isn''t just a shop — it''s a small contribution to celebrating modesty in our culture."
}'::jsonb),
('values', true, 5, '{
  "cards": [
    {"icon": "Heart", "title": "Made With Love", "description": "Every piece is chosen with care, keeping comfort and elegance at heart."},
    {"icon": "Shield", "title": "Quality You Trust", "description": "Premium fabrics and finishing — quality you can feel from the first wear."},
    {"icon": "Truck", "title": "Fast Delivery", "description": "Delivered across all 64 districts of Bangladesh, quickly and safely."},
    {"icon": "Sparkles", "title": "Honest Pricing", "description": "Premium modest wear at fair prices — no hidden charges, ever."}
  ]
}'::jsonb),
('cta', true, 6, '{
  "text": "Ready to find your next favourite abaya?",
  "button_text": "Shop The Collection",
  "button_link": "/shop"
}'::jsonb)
ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, enabled = EXCLUDED.enabled, sort_order = EXCLUDED.sort_order, updated_at = now();

-- 4. Update homepage brand_story with image + better copy
UPDATE public.homepage_sections
SET content = jsonb_build_object(
  'title', 'Our Story',
  'text', 'Nupur Abaya And More was born from a love for modest fashion and a wish to make it accessible to every woman in Bangladesh. From elegant abayas to graceful khimars and coordinated sets, every piece is chosen with care — so you can step out feeling confident, modest, and beautifully you.',
  'image', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=900&q=80&auto=format&fit=crop',
  'button_text', 'Learn More About Us',
  'button_link', '/about'
),
updated_at = now()
WHERE id = 'brand_story';
