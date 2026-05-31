UPDATE public.direct_order_channels
SET identifier = '8801700000000'
WHERE identifier = '' AND lower(label) NOT LIKE '%messenger%' AND lower(label) NOT LIKE '%facebook%';

UPDATE public.direct_order_channels
SET identifier = 'nupurabayaandmore'
WHERE identifier = '' AND (lower(label) LIKE '%messenger%' OR lower(label) LIKE '%facebook%');