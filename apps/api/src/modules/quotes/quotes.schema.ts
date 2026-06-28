import { z } from 'zod';

export const QuoteItemInputSchema = z.object({
  productId: z.string().min(1).optional(),
  productSku: z.string().min(1).max(64),
  productName: z.string().min(1).max(200),
  quantity: z.number().int().positive().max(1_000_000),
  notes: z.string().max(500).optional(),
});

export const CreateQuoteSchema = z.object({
  companyName: z.string().min(1).max(200),
  contactName: z.string().min(1).max(120),
  contactEmail: z.string().email().max(200),
  contactPhone: z.string().max(40).optional(),
  country: z.string().max(80).optional(),
  province: z.string().max(80).optional(),
  city: z.string().max(80).optional(),
  postalCode: z.string().max(20).optional(),
  notes: z.string().max(2000).optional(),
  source: z.string().max(64).optional(),
  recaptchaToken: z.string().max(2048).optional(),
  items: z.array(QuoteItemInputSchema).min(1).max(50),
});

export type CreateQuoteInput = z.infer<typeof CreateQuoteSchema>;
