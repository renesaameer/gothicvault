ALTER TABLE public.floating_icons
  ADD COLUMN IF NOT EXISTS icon_color text NOT NULL DEFAULT '#ffffff',
  ADD COLUMN IF NOT EXISTS preset_key text;

ALTER TABLE public.floating_icons_settings
  ADD COLUMN IF NOT EXISTS animation_style text NOT NULL DEFAULT 'radar',
  ADD COLUMN IF NOT EXISTS animation_intensity text NOT NULL DEFAULT 'med';