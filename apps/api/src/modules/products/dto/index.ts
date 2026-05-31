import { z } from 'zod';

// Pagination query params
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type PaginationDto = z.infer<typeof paginationSchema>;

// Product filter query params
export const productFilterSchema = z.object({
  category: z.string().optional(),
  brand: z.string().optional(),
  tag: z.string().optional(),
  search: z.string().optional(),
  status: z.enum(['draft', 'active', 'archived']).optional(),
  featured: z.coerce.boolean().optional(),
  bestSeller: z.coerce.boolean().optional(),
  isNewArrival: z.coerce.boolean().optional(),
  sortBy: z.enum(['name', 'price', 'createdAt', 'sortOrder']).default('sortOrder'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type ProductFilterDto = z.infer<typeof productFilterSchema>;

// Combined query params
export const productQuerySchema = paginationSchema.merge(productFilterSchema);

export type ProductQueryDto = z.infer<typeof productQuerySchema>;

// Create Product DTO
export const createProductSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  sku: z.string().optional(),
  price: z.number().positive(),
  basePrice: z.number().positive(),
  comparePrice: z.number().positive().optional(),
  salePrice: z.number().positive().optional(),
  stock: z.number().int().min(0).default(0),
  rating: z.number().min(0).max(5).default(0),
  reviewCount: z.number().int().min(0).default(0),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  shippingText: z.string().optional(),
  stockStatusText: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
  status: z.enum(['draft', 'active', 'archived']).default('draft'),
  featured: z.boolean().default(false),
  bestSeller: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  showOffers: z.boolean().default(true),
  showShippingInfo: z.boolean().default(true),
  showShippingText: z.boolean().default(true),
  showStockStatus: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export type CreateProductDto = z.infer<typeof createProductSchema>;

// Update Product DTO
export const updateProductSchema = createProductSchema.partial();

export type UpdateProductDto = z.infer<typeof updateProductSchema>;

// Product Response DTO
export const productResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  sku: z.string().nullable(),
  price: z.number(),
  basePrice: z.number(),
  comparePrice: z.number().nullable(),
  salePrice: z.number().nullable(),
  stock: z.number(),
  rating: z.number(),
  reviewCount: z.number(),
  description: z.string().nullable(),
  shortDescription: z.string().nullable(),
  shippingText: z.string().nullable(),
  stockStatusText: z.string().nullable(),
  categoryId: z.string().nullable(),
  brandId: z.string().nullable(),
  status: z.enum(['draft', 'active', 'archived']),
  featured: z.boolean(),
  bestSeller: z.boolean(),
  isNewArrival: z.boolean(),
  showOffers: z.boolean(),
  showShippingInfo: z.boolean(),
  showShippingText: z.boolean(),
  showStockStatus: z.boolean(),
  sortOrder: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ProductResponse = z.infer<typeof productResponseSchema>;

// Product with relations Response DTO
export const productWithRelationsSchema = productResponseSchema.extend({
  category: z.object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
  }).nullable(),
  brand: z.object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
  }).nullable(),
  variants: z.array(z.any()),
  media: z.array(z.any()),
  faqs: z.array(z.any()),
  tabs: z.array(z.any()),
  offers: z.array(z.any()),
  tags: z.array(z.any()),
});

export type ProductWithRelations = z.infer<typeof productWithRelationsSchema>;

// Paginated Response DTO
export const paginatedResponseSchema = z.object({
  data: z.array(productWithRelationsSchema),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export type PaginatedResponse = z.infer<typeof paginatedResponseSchema>;

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
