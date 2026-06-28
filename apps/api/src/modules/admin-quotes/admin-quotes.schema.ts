import { z } from 'zod';
import { QuoteStatus } from '@prisma/client';

export const UpdateQuoteStatusSchema = z.object({
  status: z.nativeEnum(QuoteStatus),
  message: z.string().max(2000).optional(),
  totalEstimate: z.number().nonnegative().optional(),
  validUntil: z.string().datetime().optional(),
  notifyBuyer: z.boolean().default(true),
});

export type UpdateQuoteStatusInput = z.infer<typeof UpdateQuoteStatusSchema>;

export const AssignQuoteSchema = z.object({
  salesRepId: z.string().min(1).nullable(),
});

export type AssignQuoteInput = z.infer<typeof AssignQuoteSchema>;
