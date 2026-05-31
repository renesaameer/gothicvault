
-- Add title column to homepage_sections and about_sections
ALTER TABLE public.homepage_sections ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.about_sections ADD COLUMN IF NOT EXISTS title TEXT;

-- Set titles for homepage sections
UPDATE public.homepage_sections SET title = 'Hero' WHERE id = 'hero';
UPDATE public.homepage_sections SET title = 'Featured Products' WHERE id = 'featured';
UPDATE public.homepage_sections SET title = 'Best Sellers' WHERE id = 'bestsellers';
UPDATE public.homepage_sections SET title = 'Categories Showcase' WHERE id = 'categories_showcase';
UPDATE public.homepage_sections SET title = 'Brands Showcase' WHERE id = 'brands_showcase';
UPDATE public.homepage_sections SET title = 'Brand Story' WHERE id = 'brand_story';
UPDATE public.homepage_sections SET title = 'Why Choose Us' WHERE id = 'why_choose_us';
UPDATE public.homepage_sections SET title = 'Testimonials' WHERE id = 'testimonials';
UPDATE public.homepage_sections SET title = 'FAQ' WHERE id = 'faq';
UPDATE public.homepage_sections SET title = 'Newsletter' WHERE id = 'newsletter';

-- Set titles for about sections
UPDATE public.about_sections SET title = 'Header' WHERE id = 'header';
UPDATE public.about_sections SET title = 'Our Story' WHERE id = 'story';
UPDATE public.about_sections SET title = 'Mission & Vision' WHERE id = 'mission_vision';
UPDATE public.about_sections SET title = 'Founder' WHERE id = 'founder';
UPDATE public.about_sections SET title = 'Our Values' WHERE id = 'values';
UPDATE public.about_sections SET title = 'Call to Action' WHERE id = 'cta';

-- Add receiving_email to contact_settings
ALTER TABLE public.contact_settings ADD COLUMN IF NOT EXISTS receiving_email TEXT;

-- Create policies table
CREATE TABLE public.policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT DEFAULT '',
  enabled BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read policies" ON public.policies FOR SELECT USING (true);
CREATE POLICY "Admins manage policies" ON public.policies FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Insert default policies
INSERT INTO public.policies (title, slug, content, sort_order) VALUES
  ('Privacy Policy', 'privacy-policy', 'Step & Style respects your privacy. We collect only essential information needed to process your orders and improve your shopping experience.

**Information We Collect:**
- Name, email, phone number, and shipping address when you place an order
- Browsing behavior on our website for analytics purposes

**How We Use Your Information:**
- Process and deliver your orders
- Send order updates via SMS/email
- Improve our products and services

**Data Security:**
We implement industry-standard security measures to protect your personal information. We never sell or share your data with third parties for marketing purposes.

**Contact:**
For privacy-related inquiries, email us at hello@stepandstyle.com', 0),
  ('Refund & Return Policy', 'refund-return', '**7-Day Easy Return Policy**

We want you to love your purchase. If you are not satisfied, we offer hassle-free returns within 7 days of delivery.

**Eligible for Return:**
- Product is damaged or defective
- Product does not match the description or images
- Wrong item delivered

**Not Eligible:**
- Used or worn items
- Items without original packaging
- Items returned after 7 days

**Refund Process:**
1. Contact us via WhatsApp or email within 7 days
2. Share photos of the issue
3. We will arrange pickup or provide return instructions
4. Refund will be processed within 3-5 business days after receiving the item

**Exchange:**
We offer free exchanges for size/color within 7 days, subject to availability.', 1),
  ('Shipping Policy', 'shipping', '**Nationwide Delivery Across Bangladesh**

We deliver to every district in Bangladesh with care and speed.

**Delivery Times:**
- Inside Dhaka: 1-2 business days
- Outside Dhaka: 3-5 business days

**Shipping Charges:**
- Inside Dhaka: ৳80 (Free on orders above ৳3,000)
- Outside Dhaka: ৳150 (Free on orders above ৳5,000)

**Packaging:**
All orders are carefully packaged in premium boxes to ensure your bag arrives in perfect condition.

**Order Tracking:**
Once shipped, you will receive a tracking number via SMS. You can also track your order on our website.', 2),
  ('Terms & Conditions', 'terms-conditions', '**Terms of Service**

By using Step & Style website and services, you agree to the following terms:

**Orders & Payment:**
- All prices are in BDT (Bangladeshi Taka)
- We accept Cash on Delivery (COD) and mobile banking (bKash, Nagad)
- Orders are confirmed via phone call or SMS
- We reserve the right to cancel suspicious orders

**Product Information:**
- We strive to display accurate product colors and details
- Slight color variations may occur due to screen differences
- All product descriptions are for informational purposes

**Intellectual Property:**
All content, images, and branding on this website are property of Step & Style. Unauthorized use is prohibited.

**Limitation of Liability:**
Step & Style is not liable for delays caused by courier services, natural disasters, or circumstances beyond our control.

**Changes to Terms:**
We reserve the right to update these terms at any time. Continued use of our services constitutes acceptance of updated terms.', 3);
