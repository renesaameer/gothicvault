
-- Landing page analytics events table
CREATE TABLE public.landing_page_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_page_id uuid REFERENCES public.landing_pages(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL DEFAULT 'view',
  order_total numeric DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for fast aggregation queries
CREATE INDEX idx_landing_page_events_page_id ON public.landing_page_events(landing_page_id);
CREATE INDEX idx_landing_page_events_created_at ON public.landing_page_events(created_at);
CREATE INDEX idx_landing_page_events_type ON public.landing_page_events(event_type);

-- RLS
ALTER TABLE public.landing_page_events ENABLE ROW LEVEL SECURITY;

-- Anyone can insert events (for tracking views/conversions from public pages)
CREATE POLICY "Anyone can insert landing page events"
  ON public.landing_page_events FOR INSERT
  WITH CHECK (true);

-- Only admin can read analytics
CREATE POLICY "Admin can read landing page events"
  ON public.landing_page_events FOR SELECT
  USING (is_admin_or_staff(auth.uid()));

-- Admin can manage events
CREATE POLICY "Admin can manage landing page events"
  ON public.landing_page_events FOR ALL
  USING (is_admin_or_staff(auth.uid()))
  WITH CHECK (is_admin_or_staff(auth.uid()));

-- Aggregation function for fast analytics
CREATE OR REPLACE FUNCTION public.get_landing_page_analytics(
  _days integer DEFAULT 30
)
RETURNS TABLE(
  landing_page_id uuid,
  page_title text,
  page_slug text,
  total_views bigint,
  total_conversions bigint,
  total_revenue numeric,
  conversion_rate numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT
    lp.id AS landing_page_id,
    lp.title AS page_title,
    lp.slug AS page_slug,
    COUNT(*) FILTER (WHERE e.event_type = 'view') AS total_views,
    COUNT(*) FILTER (WHERE e.event_type = 'conversion') AS total_conversions,
    COALESCE(SUM(e.order_total) FILTER (WHERE e.event_type = 'conversion'), 0) AS total_revenue,
    CASE 
      WHEN COUNT(*) FILTER (WHERE e.event_type = 'view') > 0 
      THEN ROUND(
        (COUNT(*) FILTER (WHERE e.event_type = 'conversion')::numeric / 
         COUNT(*) FILTER (WHERE e.event_type = 'view')::numeric) * 100, 2
      )
      ELSE 0
    END AS conversion_rate
  FROM public.landing_pages lp
  LEFT JOIN public.landing_page_events e 
    ON e.landing_page_id = lp.id 
    AND e.created_at >= now() - (_days || ' days')::interval
  GROUP BY lp.id, lp.title, lp.slug
  ORDER BY total_views DESC;
$$;
