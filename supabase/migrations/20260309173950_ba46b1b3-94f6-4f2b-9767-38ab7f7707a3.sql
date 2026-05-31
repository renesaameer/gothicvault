
-- Create invoice_settings table
CREATE TABLE public.invoice_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  store_name TEXT DEFAULT 'Step & Style',
  store_phone TEXT DEFAULT '+880 1XXX-XXXXXX',
  store_email TEXT DEFAULT 'hello@stepandstyle.com',
  store_address TEXT DEFAULT 'Dhaka, Bangladesh',
  logo_url TEXT,
  footer_text TEXT DEFAULT 'Thank you for shopping with Step & Style!',
  signature_label TEXT DEFAULT '',
  terms_text TEXT DEFAULT ''
);
ALTER TABLE public.invoice_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read invoice settings" ON public.invoice_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage invoice settings" ON public.invoice_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.invoice_settings (id) VALUES ('default');
