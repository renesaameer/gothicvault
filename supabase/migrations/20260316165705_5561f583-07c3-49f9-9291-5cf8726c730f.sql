CREATE TABLE public.footer_settings (
  id text NOT NULL DEFAULT 'default' PRIMARY KEY,
  store_name text DEFAULT 'Step & Style',
  description text DEFAULT 'Bangladesh''s premium destination for luxury ladies bags, handbags, clutches & accessories. Elevate your style.',
  email text DEFAULT 'support@stepandstyle.com',
  phone text DEFAULT '+880 1700 000000',
  address text DEFAULT 'Dhaka, Bangladesh',
  copyright_text text DEFAULT '© {year} Step & Style. All rights reserved.',
  social_links jsonb DEFAULT '[{"platform":"facebook","url":"https://facebook.com/stepandstyle","enabled":true},{"platform":"instagram","url":"https://instagram.com/stepandstyle","enabled":true}]'::jsonb,
  quick_links jsonb DEFAULT '[{"label":"Home","url":"/"},{"label":"Shop","url":"/shop"},{"label":"About","url":"/about"},{"label":"Contact","url":"/contact"},{"label":"Policies","url":"/policies"}]'::jsonb,
  customer_care_links jsonb DEFAULT '[{"label":"Track Order","url":"/track-order"},{"label":"Privacy Policy","url":"/policies?tab=privacy"},{"label":"Refund Policy","url":"/policies?tab=refund"},{"label":"Shipping Policy","url":"/policies?tab=shipping"},{"label":"Terms & Conditions","url":"/policies?tab=terms"}]'::jsonb,
  newsletter_enabled boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.footer_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read footer settings" ON public.footer_settings FOR SELECT TO public USING (true);
CREATE POLICY "Admins manage footer settings" ON public.footer_settings FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.footer_settings (id) VALUES ('default');