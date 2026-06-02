import { z } from 'zod';

export const createCustomerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().optional(),
  phone: z.string().min(10).max(20),
  address: z.string().optional(),
  city: z.string().optional(),
});

export type CreateCustomerDto = z.infer<typeof createCustomerSchema>;

export const updateCustomerSchema = createCustomerSchema.partial();

export type UpdateCustomerDto = z.infer<typeof updateCustomerSchema>;

export const customerQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  search: z.string().optional(),
});

export type CustomerQueryDto = z.infer<typeof customerQuerySchema>;
