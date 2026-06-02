import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100),
  description: z.string().optional(),
  categoryType: z.enum(['product', 'brand', 'collection']).default('product'),
  parentId: z.string().uuid().optional(),
  imageUrl: z.string().url().optional(),
  sortOrder: z.number().int().default(0),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  featured: z.boolean().default(false),
});

export type CreateCategoryDto = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = createCategorySchema.partial();

export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;

export const categoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  categoryType: z.enum(['product', 'brand', 'collection']).optional(),
  search: z.string().optional(),
});

export type CategoryQueryDto = z.infer<typeof categoryQuerySchema>;
