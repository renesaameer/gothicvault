import { z } from 'zod';

const addressSchema = z.object({
  country: z.string().min(1).default('Bangladesh'),
  district: z.string().optional(),
  city: z.string().optional(),
  line1: z.string().min(1),
  landmark: z.string().optional(),
  deliveryZone: z.string().optional(),
  deliveryZoneId: z.string().uuid().optional(),
});

export const checkoutSchema = z.object({
  customerName: z.string().min(2),
  customerEmail: z.string().email().optional().or(z.literal('')),
  customerPhone: z.string().regex(/^\d{11}$/, 'Phone must be 11 digits'),
  customerAddress: z.string().min(3),
  customerCity: z.string().optional(),
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  paymentMethod: z.enum(['cod', 'bkash', 'nagad', 'rocket', 'card', 'bank_transfer']),
  deliveryZoneId: z.string().uuid().optional(),
  shippingCost: z.number().min(0).optional(),
  notes: z.string().optional(),
  paymentProvider: z.string().optional(),
});

export type CheckoutDto = z.infer<typeof checkoutSchema>;
