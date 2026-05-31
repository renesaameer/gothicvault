ALTER TABLE public.design_settings
  ADD COLUMN IF NOT EXISTS favicon_url text,
  ADD COLUMN IF NOT EXISTS secondary_color text DEFAULT '#6b7280',
  ADD COLUMN IF NOT EXISTS button_style text DEFAULT 'solid';