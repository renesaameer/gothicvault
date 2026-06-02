import { z } from 'zod';

export const createHomepageSettingsSchema = z.object({
  heroTitle: z.string().optional(),
  heroSubtitle: z.string().optional(),
  heroImageUrl: z.string().url().optional(),
  heroCtaText: z.string().optional(),
  heroCtaLink: z.string().url().optional(),
  featuredProductIds: z.array(z.string().uuid()).optional(),
  bannerImageUrl: z.string().url().optional(),
  bannerTitle: z.string().optional(),
  bannerLink: z.string().url().optional(),
  showNewsletter: z.boolean().default(true),
  newsletterTitle: z.string().optional(),
  newsletterDescription: z.string().optional(),
});

export type CreateHomepageSettingsDto = z.infer<typeof createHomepageSettingsSchema>;

export const updateHomepageSettingsSchema = createHomepageSettingsSchema.partial();

export type UpdateHomepageSettingsDto = z.infer<typeof updateHomepageSettingsSchema>;
