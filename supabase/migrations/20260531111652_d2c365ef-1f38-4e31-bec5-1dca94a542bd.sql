INSERT INTO public.user_roles (user_id, role) VALUES ('b99d61f8-9764-4824-8e50-e9edc4fdbd82', 'admin') ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.delivery_zones (name, zone_name, areas, delivery_charge, shipping_cost, estimated_days, enabled, sort_order)
VALUES ('Inside Dhaka', 'Inside Dhaka', '[]'::jsonb, 100, 100, '1-2 days', true, 0);