ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS steadfast_consignment_id text,
  ADD COLUMN IF NOT EXISTS steadfast_tracking_code text,
  ADD COLUMN IF NOT EXISTS steadfast_status text,
  ADD COLUMN IF NOT EXISTS last_status_sync_time timestamptz,
  ADD COLUMN IF NOT EXISTS courier_sync_failed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS courier_last_error text;

CREATE INDEX IF NOT EXISTS idx_orders_steadfast_sync
  ON public.orders (courier_sync_failed, steadfast_consignment_id, order_status);

INSERT INTO public.delivery_partners (name, slug, enabled, config)
SELECT 'Steadfast Courier', 'steadfast', false,
       '{"api_base_url":"https://portal.packzy.com/api/v1","delivery_type":0}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.delivery_partners WHERE slug = 'steadfast');

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $outer$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'steadfast-sync-status') THEN
    PERFORM cron.unschedule('steadfast-sync-status');
  END IF;
  PERFORM cron.schedule(
    'steadfast-sync-status',
    '*/30 * * * *',
    $cron$
    SELECT net.http_post(
      url := 'https://uhgtyzcuubhgrvgcsaqh.supabase.co/functions/v1/steadfast-sync-status',
      headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoZ3R5emN1dWJoZ3J2Z2NzYXFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4ODg5MjQsImV4cCI6MjA5MzQ2NDkyNH0.yxGGRRl21lXtXYVZDpZYiHE54as1VCh135GjaFGQz4w"}'::jsonb,
      body := '{}'::jsonb
    );
    $cron$
  );
END
$outer$;