import { z } from 'zod';

export const OrderItemInputSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive().max(1_000_000),
  notes: z.string().max(500).optional(),
});

export const CreateOrderSchema = z.object({
  shippingAddressId: z.string().min(1),
  billingAddressId: z.string().min(1).optional(),
  notes: z.string().max(2000).optional(),
  sourceQuoteId: z.string().min(1).optional(),
  items: z.array(OrderItemInputSchema).min(1).max(100),
});
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
