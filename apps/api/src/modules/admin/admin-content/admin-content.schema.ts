import { z } from 'zod';
import { PageStatus } from '@prisma/client';

export const PageInputSchema = z.object({
  slug: z.string().min(1).max(200).regex(/^[a-z0-9\-/]+$/),
  title: z.string().min(1).max(300),
  body: z.string().max(200_000),
  status: z.nativeEnum(PageStatus).default(PageStatus.DRAFT),
  metaTitle: z.string().max(200).optional(),
  metaDescription: z.string().max(500).optional(),
  publishedAt: z.string().datetime().nullable().optional(),
});
export type PageInput = z.infer<typeof PageInputSchema>;

export const BlogPostInputSchema = z.object({
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(300),
  excerpt: z.string().max(500).optional(),
  body: z.string().max(200_000),
  status: z.nativeEnum(PageStatus).default(PageStatus.DRAFT),
  coverImageUrl: z.string().url().max(2000).optional(),
  tags: z.array(z.string().max(50)).max(20).default([]),
  metaTitle: z.string().max(200).optional(),
  metaDescription: z.string().max(500).optional(),
  publishedAt: z.string().datetime().nullable().optional(),
});
export type BlogPostInput = z.infer<typeof BlogPostInputSchema>;
