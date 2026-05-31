
-- Hero slides table
CREATE TABLE public.hero_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sort_order integer NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  desktop_image text,
  desktop_video text,
  mobile_image text,
  mobile_video text,
  headline text DEFAULT '',
  subtext text DEFAULT '',
  button1_text text DEFAULT 'Shop Now',
  button1_link text DEFAULT '/shop',
  button2_text text DEFAULT 'Learn More',
  button2_link text DEFAULT '/about',
  button1_enabled boolean NOT NULL DEFAULT true,
  button2_enabled boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage hero slides" ON public.hero_slides FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Public can read hero slides" ON public.hero_slides FOR SELECT USING (true);

-- Announcement bar table
CREATE TABLE public.announcement_bar (
  id text PRIMARY KEY DEFAULT 'default',
  enabled boolean NOT NULL DEFAULT false,
  text text NOT NULL DEFAULT '',
  link text DEFAULT '',
  bg_color text NOT NULL DEFAULT '#000000',
  text_color text NOT NULL DEFAULT '#ffffff',
  dismissible boolean NOT NULL DEFAULT true,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.announcement_bar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage announcement bar" ON public.announcement_bar FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Public can read announcement bar" ON public.announcement_bar FOR SELECT USING (true);

-- Seed default announcement bar row
INSERT INTO public.announcement_bar (id, enabled, text) VALUES ('default', false, '🎉 Free shipping on orders over ৳1500!');
