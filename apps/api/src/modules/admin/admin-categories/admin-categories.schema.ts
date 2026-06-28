import { z } from 'zod';

export const CategoryInputSchema = z.object({
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, 'lowercase letters/numbers/hyphens only'),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  imageUrl: z.string().url().max(2000).optional(),
  parentId: z.string().min(1).nullable().optional(),
  sortOrder: z.number().int().nonnegative().default(0),
  isVisible: z.boolean().default(true),
  metaTitle: z.string().max(200).optional(),
  metaDescription: z.string().max(500).optional(),
});
export type CategoryInput = z.infer<typeof CategoryInputSchema>;

export const CategoryReorderSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        sortOrder: z.number().int().nonnegative(),
        parentId: z.string().min(1).nullable().optional(),
      }),
    )
    .min(1)
    .max(500),
});
export type CategoryReorderInput = z.infer<typeof CategoryReorderSchema>;
