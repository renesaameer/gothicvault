import { z } from 'zod';

export const createCouponSchema = z.object({
  code: z.string().min(3).max(50).toUpperCase(),
  discountType: z.enum(['percentage', 'fixed', 'free_shipping']),
  discountValue: z.number().min(0),
  enabled: z.boolean().default(true),
  maxUses: z.number().int().min(0).nullable().optional(),
  minCartTotal: z.number().min(0).optional(),
  minOrderAmount: z.number().min(0).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  expiresAt: z.date().optional(),
  description: z.string().optional(),
});

export type CreateCouponDto = z.infer<typeof createCouponSchema>;

export const updateCouponSchema = createCouponSchema.partial();

export type UpdateCouponDto = z.infer<typeof updateCouponSchema>;

export const couponQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  enabled: z.coerce.boolean().optional(),
  search: z.string().optional(),
});

export type CouponQueryDto = z.infer<typeof couponQuerySchema>;
