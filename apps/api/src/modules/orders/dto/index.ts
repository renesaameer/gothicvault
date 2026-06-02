import { z } from 'zod';

export const orderQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  orderStatus: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned']).optional(),
  paymentStatus: z
    .enum([
      'pending',
      'paid',
      'failed',
      'refunded',
      'pending_cod',
      'pending_bkash',
      'pending_nagad',
      'pending_rocket',
      'pending_card',
    ])
    .optional(),
  fulfillmentStatus: z
    .enum(['unfulfilled', 'processing', 'packed', 'shipped', 'delivered', 'cancelled'])
    .optional(),
  search: z.string().optional(),
});

export const updateOrderStatusSchema = z.object({
  orderStatus: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned']).optional(),
  paymentStatus: z
    .enum([
      'pending',
      'paid',
      'failed',
      'refunded',
      'pending_cod',
      'pending_bkash',
      'pending_nagad',
      'pending_rocket',
      'pending_card',
    ])
    .optional(),
  fulfillmentStatus: z
    .enum(['unfulfilled', 'processing', 'packed', 'shipped', 'delivered', 'cancelled'])
    .optional(),
  trackingNumber: z.string().optional(),
  deliveryPartner: z.string().optional(),
  notes: z.string().optional(),
});

export const refundPlaceholderSchema = z.object({
  amount: z.number().positive().optional(),
  reason: z.string().min(3).optional(),
  provider: z.enum(['stripe', 'bkash', 'sslcommerz', 'manual']).default('manual'),
});

export type OrderQueryDto = z.infer<typeof orderQuerySchema>;
export type UpdateOrderStatusDto = z.infer<typeof updateOrderStatusSchema>;
export type RefundPlaceholderDto = z.infer<typeof refundPlaceholderSchema>;
