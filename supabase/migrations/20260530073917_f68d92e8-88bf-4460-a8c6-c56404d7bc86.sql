UPDATE homepage_sections
SET content = jsonb_build_object(
  'enabled', true,
  'title', 'The MaverickMist Story',
  'text', 'MaverickMist was born from a simple idea — that fragrance should feel personal, never performative. Crafted in Bangladesh and inspired by the soft confidence of modern women, every bottle is hand-blended in small batches from premium oils sourced across France, Bulgaria and the Middle East.

We design scents that linger like a memory — delicate florals at dawn, warm orientals at dusk, and bright, weightless freshness in between. Each composition is built for longevity and balance, so a single spray carries you through the entire day.

This is luxury made quietly — a fragrance you wear for yourself first.',
  'image', '/perfume/hero.jpg',
  'button_text', 'Explore the Collection',
  'button_link', '/shop'
)
WHERE id = 'brand_story';