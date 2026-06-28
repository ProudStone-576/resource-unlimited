import { z } from 'zod';
import { BannerPlacement, DiscountType, PromotionScope, PromotionStatus } from '@prisma/client';

export const PromotionInputSchema = z.object({
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  status: z.nativeEnum(PromotionStatus).default(PromotionStatus.DRAFT),
  scope: z.nativeEnum(PromotionScope).default(PromotionScope.PUBLIC),
  discountType: z.nativeEnum(DiscountType).nullable().optional(),
  discountValue: z.number().nonnegative().nullable().optional(),
  minOrderTotal: z.number().nonnegative().nullable().optional(),
  currency: z.string().length(3).default('CAD'),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
  bannerId: z.string().min(1).nullable().optional(),
  targetCompanyIds: z.array(z.string()).optional(),
});
export type PromotionInput = z.infer<typeof PromotionInputSchema>;

export const BannerInputSchema = z.object({
  placement: z.nativeEnum(BannerPlacement),
  title: z.string().min(1).max(200),
  subtitle: z.string().max(500).optional(),
  ctaLabel: z.string().max(120).optional(),
  ctaHref: z.string().max(2000).optional(),
  imageUrl: z.string().url().max(2000).optional(),
  imageAlt: z.string().max(300).optional(),
  isActive: z.boolean().default(true),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
  sortOrder: z.number().int().nonnegative().default(0),
});
export type BannerInput = z.infer<typeof BannerInputSchema>;
