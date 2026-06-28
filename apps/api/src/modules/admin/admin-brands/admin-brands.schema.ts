import { z } from 'zod';

export const BrandInputSchema = z.object({
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  logoUrl: z.string().url().max(2000).optional(),
  websiteUrl: z.string().url().max(2000).optional(),
  isVisible: z.boolean().default(true),
  sortOrder: z.number().int().nonnegative().default(0),
  metaTitle: z.string().max(200).optional(),
  metaDescription: z.string().max(500).optional(),
});
export type BrandInput = z.infer<typeof BrandInputSchema>;
