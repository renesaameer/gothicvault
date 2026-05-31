UPDATE public.homepage_sections
SET content = jsonb_build_object(
  'enabled', true,
  'title', 'The MaverickMist Story',
  'text', E'MaverickMist began with a quiet belief — that fragrance should feel personal, not performative. Founded in Bangladesh and crafted by a small team of perfumers, every bottle is hand-blended in limited batches using premium oils sourced from the historic perfume houses of France, the rose valleys of Bulgaria, and the oud markets of the Middle East.\n\nOur scents are built to linger like a memory — delicate florals at dawn, warm orientals at dusk, and clean, weightless freshness in between. Each composition is balanced for longevity, so a single spray carries you gracefully through the day.\n\nThis is luxury made quietly — a fragrance you wear for yourself first.',
  'image', '/perfume/hero.jpg',
  'button_text', 'Explore the Collection',
  'button_link', '/shop'
)
WHERE id = 'brand_story';