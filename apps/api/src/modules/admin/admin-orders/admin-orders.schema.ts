import { z } from 'zod';
import { OrderStatus } from '@prisma/client';

export const ListOrdersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
  status: z.nativeEnum(OrderStatus).optional(),
  companyId: z.string().optional(),
  search: z.string().optional(),
});
export type ListOrdersQuery = z.infer<typeof ListOrdersQuerySchema>;

export const UpdateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  message: z.string().max(2000).optional(),
});
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;
