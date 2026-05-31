INSERT INTO public.direct_order_channels (id, label, identifier, message_template, enabled, sort_order)
VALUES
  (gen_random_uuid(), 'Order on WhatsApp', '', 'Hi! I want to order: {product_name} - {product_url}', true, 1),
  (gen_random_uuid(), 'Order on Messenger', '', '', true, 2)
ON CONFLICT DO NOTHING;