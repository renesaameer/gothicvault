-- Migration 3: Homepage content tables for admin editors

-- Announcement bar (singleton row with id='default')
CREATE TABLE public.announcement_bar (
  id text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT false,
  text text NOT NULL DEFAULT '',
  link text NOT NULL DEFAULT '',
  bg_color text NOT NULL DEFAULT '#000000',
  text_color text NOT NULL DEFAULT '#ffffff',
  dismissible boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.announcement_bar (id) VALUES ('default');
ALTER TABLE public.announcement_bar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view announcement bar" ON public.announcement_bar FOR SELECT USING (true);
CREATE POLICY "Admins can update announcement bar" ON public.announcement_bar FOR UPDATE TO authenticated USING (is_admin_or_staff(auth.uid()));

-- Hero slides
CREATE TABLE public.hero_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sort_order integer NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  image_url text NOT NULL DEFAULT '',
  title text,
  subtitle text,
  button_text text,
  button_link text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view enabled slides" ON public.hero_slides FOR SELECT USING (enabled = true);
CREATE POLICY "Admins can view all slides" ON public.hero_slides FOR SELECT TO authenticated USING (is_admin_or_staff(auth.uid()));
CREATE POLICY "Admins can insert slides" ON public.hero_slides FOR INSERT TO authenticated WITH CHECK (is_admin_or_staff(auth.uid()));
CREATE POLICY "Admins can update slides" ON public.hero_slides FOR UPDATE TO authenticated USING (is_admin_or_staff(auth.uid()));
CREATE POLICY "Admins can delete slides" ON public.hero_slides FOR DELETE TO authenticated USING (is_admin_or_staff(auth.uid()));

-- Home FAQs
CREATE TABLE public.home_faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.home_faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view faqs" ON public.home_faqs FOR SELECT USING (true);
CREATE POLICY "Admins can insert faqs" ON public.home_faqs FOR INSERT TO authenticated WITH CHECK (is_admin_or_staff(auth.uid()));
CREATE POLICY "Admins can update faqs" ON public.home_faqs FOR UPDATE TO authenticated USING (is_admin_or_staff(auth.uid()));
CREATE POLICY "Admins can delete faqs" ON public.home_faqs FOR DELETE TO authenticated USING (is_admin_or_staff(auth.uid()));

-- Testimonials
CREATE TABLE public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  review text NOT NULL DEFAULT '',
  rating integer NOT NULL DEFAULT 5,
  image_url text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view testimonials" ON public.testimonials FOR SELECT USING (true);
CREATE POLICY "Admins can insert testimonials" ON public.testimonials FOR INSERT TO authenticated WITH CHECK (is_admin_or_staff(auth.uid()));
CREATE POLICY "Admins can update testimonials" ON public.testimonials FOR UPDATE TO authenticated USING (is_admin_or_staff(auth.uid()));
CREATE POLICY "Admins can delete testimonials" ON public.testimonials FOR DELETE TO authenticated USING (is_admin_or_staff(auth.uid()));

-- Why choose us cards
CREATE TABLE public.why_choose_us_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  icon_name text NOT NULL DEFAULT 'Shield',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.why_choose_us_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view cards" ON public.why_choose_us_cards FOR SELECT USING (true);
CREATE POLICY "Admins can insert cards" ON public.why_choose_us_cards FOR INSERT TO authenticated WITH CHECK (is_admin_or_staff(auth.uid()));
CREATE POLICY "Admins can update cards" ON public.why_choose_us_cards FOR UPDATE TO authenticated USING (is_admin_or_staff(auth.uid()));
CREATE POLICY "Admins can delete cards" ON public.why_choose_us_cards FOR DELETE TO authenticated USING (is_admin_or_staff(auth.uid()));