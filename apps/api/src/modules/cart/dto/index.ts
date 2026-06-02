import { z } from 'zod';

export const addToCartSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional().nullable(),
  quantity: z.number().int().min(1).max(99).default(1),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0).max(99),
});

export const applyCouponSchema = z.object({
  code: z.string().min(1).max(50),
});

export const removeCouponSchema = z.object({}).optional();

export type AddToCartDto = z.infer<typeof addToCartSchema>;
export type UpdateCartItemDto = z.infer<typeof updateCartItemSchema>;
export type ApplyCouponDto = z.infer<typeof applyCouponSchema>;
