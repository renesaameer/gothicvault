
-- 1) Extend orders with EcomDrive columns
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS ecomdrive_status text NOT NULL DEFAULT 'not_pushed',
  ADD COLUMN IF NOT EXISTS ecomdrive_order_id text,
  ADD COLUMN IF NOT EXISTS ecomdrive_invoice_number text,
  ADD COLUMN IF NOT EXISTS ecomdrive_courier_name text,
  ADD COLUMN IF NOT EXISTS ecomdrive_courier_method_id text,
  ADD COLUMN IF NOT EXISTS ecomdrive_pushed_at timestamptz,
  ADD COLUMN IF NOT EXISTS ecomdrive_response jsonb,
  ADD COLUMN IF NOT EXISTS ecomdrive_error text,
  ADD COLUMN IF NOT EXISTS ecomdrive_retry_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ecomdrive_failed_payload jsonb,
  ADD COLUMN IF NOT EXISTS ecomdrive_tracking_id text,
  ADD COLUMN IF NOT EXISTS ecomdrive_rider_name text,
  ADD COLUMN IF NOT EXISTS ecomdrive_rider_phone text,
  ADD COLUMN IF NOT EXISTS ecomdrive_last_status_sync timestamptz,
  ADD COLUMN IF NOT EXISTS ecomdrive_next_retry_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_orders_ecomdrive_status ON public.orders (ecomdrive_status);
CREATE INDEX IF NOT EXISTS idx_orders_ecomdrive_next_retry ON public.orders (ecomdrive_next_retry_at)
  WHERE ecomdrive_status = 'failed';

-- 2) Settings table (single row)
CREATE TABLE IF NOT EXISTS public.ecomdrive_settings (
  id text PRIMARY KEY DEFAULT 'default',
  enabled boolean NOT NULL DEFAULT false,
  business_id text NOT NULL DEFAULT '',
  api_base_url text NOT NULL DEFAULT 'https://app.ecomdrive.com/api/external',
  default_courier_method_id text,
  default_delivery_charge numeric NOT NULL DEFAULT 60,
  auto_push boolean NOT NULL DEFAULT false,
  auto_sync_tracking boolean NOT NULL DEFAULT true,
  retry_failed boolean NOT NULL DEFAULT true,
  sandbox_mode boolean NOT NULL DEFAULT false,
  enable_logs boolean NOT NULL DEFAULT true,
  api_timeout_ms integer NOT NULL DEFAULT 15000,
  last_test_at timestamptz,
  last_sync_at timestamptz,
  last_error text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ecomdrive_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage ecomdrive settings"
  ON public.ecomdrive_settings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.ecomdrive_settings (id) VALUES ('default')
  ON CONFLICT (id) DO NOTHING;

CREATE TRIGGER trg_ecomdrive_settings_updated_at
  BEFORE UPDATE ON public.ecomdrive_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Courier methods cache
CREATE TABLE IF NOT EXISTS public.ecomdrive_courier_methods (
  method_id text PRIMARY KEY,
  name text NOT NULL,
  courier text NOT NULL,
  requires_location_data boolean NOT NULL DEFAULT false,
  enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  synced_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ecomdrive_courier_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/staff can manage ecomdrive courier methods"
  ON public.ecomdrive_courier_methods FOR ALL
  TO authenticated
  USING (public.is_admin_or_staff(auth.uid()))
  WITH CHECK (public.is_admin_or_staff(auth.uid()));

CREATE POLICY "Public can read enabled ecomdrive courier methods"
  ON public.ecomdrive_courier_methods FOR SELECT
  TO public
  USING (enabled = true);

-- 4) Logs
CREATE TABLE IF NOT EXISTS public.ecomdrive_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid,
  invoice_number text,
  endpoint text NOT NULL,
  method text NOT NULL DEFAULT 'POST',
  request_payload jsonb,
  response_body jsonb,
  http_status integer,
  success boolean NOT NULL DEFAULT false,
  error text,
  retry_attempt integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ecomdrive_logs_created_at ON public.ecomdrive_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ecomdrive_logs_success ON public.ecomdrive_logs (success);
CREATE INDEX IF NOT EXISTS idx_ecomdrive_logs_order_id ON public.ecomdrive_logs (order_id);

ALTER TABLE public.ecomdrive_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can read ecomdrive logs"
  ON public.ecomdrive_logs FOR SELECT
  TO authenticated
  USING (public.is_admin_or_staff(auth.uid()));

CREATE POLICY "Admin can manage ecomdrive logs"
  ON public.ecomdrive_logs FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 5) Background job extensions (used by later cron jobs)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
