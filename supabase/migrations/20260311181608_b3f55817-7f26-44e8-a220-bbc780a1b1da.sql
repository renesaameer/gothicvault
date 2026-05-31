
ALTER TABLE public.tracking_pixels
  ADD COLUMN IF NOT EXISTS access_token text DEFAULT '',
  ADD COLUMN IF NOT EXISTS test_event_code text DEFAULT '',
  ADD COLUMN IF NOT EXISTS advanced_matching boolean DEFAULT true;
