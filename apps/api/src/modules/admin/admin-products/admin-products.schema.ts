import { z } from 'zod';
import { ProductStatus, UnitOfMeasure } from '@prisma/client';

export const ProductInputSchema = z.object({
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, 'lowercase letters/numbers/hyphens only'),
  sku: z.string().min(1).max(64),
  name: z.string().min(1).max(300),
  shortDesc: z.string().max(500).optional(),
  description: z.string().max(20_000).optional(),
  status: z.nativeEnum(ProductStatus).default(ProductStatus.ACTIVE),
  isFeatured: z.boolean().default(false),
  categoryId: z.string().min(1),
  brandId: z.string().min(1).nullable().optional(),
  brand: z.string().max(200).optional(),
  unitOfMeasure: z.nativeEnum(UnitOfMeasure).default(UnitOfMeasure.EACH),
  minOrderQty: z.number().int().positive().default(1),
  listPrice: z.number().nonnegative().nullable().optional(),
  currency: z.string().length(3).default('CAD'),
  specs: z.record(z.string(), z.unknown()).nullable().optional(),
  dimensions: z.record(z.string(), z.unknown()).nullable().optional(),
  metaTitle: z.string().max(200).optional(),
  metaDescription: z.string().max(500).optional(),
});
export type ProductInput = z.infer<typeof ProductInputSchema>;

export const ImageInputSchema = z.object({
  url: z.string().url().max(2000),
  alt: z.string().max(300).optional(),
  isPrimary: z.boolean().default(false),
  sortOrder: z.number().int().nonnegative().default(0),
  providerPublicId: z.string().max(300).optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});
export type ImageInput = z.infer<typeof ImageInputSchema>;

export const DocumentInputSchema = z.object({
  label: z.string().min(1).max(200),
  url: z.string().url().max(2000),
  mime: z.string().max(120).optional(),
  sizeKB: z.number().int().nonnegative().optional(),
});
export type DocumentInput = z.infer<typeof DocumentInputSchema>;

export const ListAdminProductsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
  search: z.string().optional(),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  status: z.nativeEnum(ProductStatus).optional(),
});
export type ListAdminProductsQuery = z.infer<typeof ListAdminProductsQuerySchema>;
