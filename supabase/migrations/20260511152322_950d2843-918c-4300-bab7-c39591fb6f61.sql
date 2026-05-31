DELETE FROM public.policies WHERE id IN ('privacy-policy','refund','shipping-policy','terms');
UPDATE public.policies SET sort_order = 1 WHERE id = 'privacy';
UPDATE public.policies SET sort_order = 2 WHERE id = 'shipping';
UPDATE public.policies SET sort_order = 3 WHERE id = 'return-exchange';
UPDATE public.policies SET sort_order = 4 WHERE id = 'terms-of-service';