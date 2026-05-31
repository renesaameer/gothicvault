ALTER TABLE public.shop_settings
ADD COLUMN IF NOT EXISTS pdp_show_why_choose_us boolean NOT NULL DEFAULT true;