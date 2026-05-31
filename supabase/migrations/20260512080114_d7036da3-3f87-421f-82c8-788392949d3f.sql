DELETE FROM public.delivery_zones
WHERE id IN (
  'b520f5d7-3162-4f71-9ae8-caa8d87a15dd',
  '42387b3f-6bdc-4b16-a10f-118389e7d8ac',
  '502b361d-b2a6-44e6-ac8e-eb54ff27d620',
  '8cd6e263-b42f-485a-b346-034d37953c45'
);

CREATE UNIQUE INDEX IF NOT EXISTS delivery_zones_zone_name_unique
  ON public.delivery_zones (lower(zone_name));