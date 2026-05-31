
CREATE TABLE public.invoice_settings (
  id text PRIMARY KEY DEFAULT 'default',
  store_name text NOT NULL DEFAULT '',
  store_address text NOT NULL DEFAULT '',
  store_phone text NOT NULL DEFAULT '',
  store_email text NOT NULL DEFAULT '',
  logo_url text,
  footer_text text NOT NULL DEFAULT 'Thank you for your business!',
  signature_label text NOT NULL DEFAULT '',
  terms_text text NOT NULL DEFAULT '',
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.invoice_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage invoice settings" ON public.invoice_settings FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Public can read invoice settings" ON public.invoice_settings FOR SELECT USING (true);

INSERT INTO public.invoice_settings (id) VALUES ('default');
