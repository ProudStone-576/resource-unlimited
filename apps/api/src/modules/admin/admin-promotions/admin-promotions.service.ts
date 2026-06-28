import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type { BannerInput, PromotionInput } from './admin-promotions.schema';

@Injectable()
export class AdminPromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  listPromotions() {
    return this.prisma.promotion.findMany({
      orderBy: { createdAt: 'desc' },
      include: { banner: true, _count: { select: { targets: true } } },
    });
  }

  getPromotion(id: string) {
    return this.prisma.promotion.findUnique({
      where: { id },
      include: { banner: true, targets: { include: { company: { select: { id: true, name: true } } } } },
    });
  }

  async createPromotion(input: PromotionInput) {
    await this.assertSlugFree(input.slug);
    const { targetCompanyIds, ...rest } = input;
    return this.prisma.$transaction(async (tx) => {
      const created = await tx.promotion.create({ data: this.toPromotionCreate(rest) });
      if (targetCompanyIds && targetCompanyIds.length > 0) {
        await tx.promotionTarget.createMany({
          data: targetCompanyIds.map((companyId) => ({ promotionId: created.id, companyId })),
        });
      }
      return created;
    });
  }

  async updatePromotion(id: string, input: PromotionInput) {
    const existing = await this.prisma.promotion.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Promotion not found');
    if (existing.slug !== input.slug) await this.assertSlugFree(input.slug);

    const { targetCompanyIds, ...rest } = input;
    return this.prisma.$transaction(async (tx) => {
      const u = await tx.promotion.update({ where: { id }, data: this.toPromotionUpdate(rest) });
      if (targetCompanyIds) {
        await tx.promotionTarget.deleteMany({ where: { promotionId: id } });
        if (targetCompanyIds.length > 0) {
          await tx.promotionTarget.createMany({
            data: targetCompanyIds.map((companyId) => ({ promotionId: id, companyId })),
          });
        }
      }
      return u;
    });
  }

  async removePromotion(id: string) {
    await this.prisma.promotion.delete({ where: { id } });
    return { ok: true };
  }

  listBanners() {
    return this.prisma.banner.findMany({ orderBy: [{ placement: 'asc' }, { sortOrder: 'asc' }] });
  }

  getBanner(id: string) {
    return this.prisma.banner.findUnique({ where: { id } });
  }

  createBanner(input: BannerInput) {
    return this.prisma.banner.create({ data: this.toBannerCreate(input) });
  }

  async updateBanner(id: string, input: BannerInput) {
    const existing = await this.prisma.banner.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Banner not found');
    return this.prisma.banner.update({ where: { id }, data: this.toBannerUpdate(input) });
  }

  async removeBanner(id: string) {
    await this.prisma.banner.delete({ where: { id } });
    return { ok: true };
  }

  private toPromotionCreate(
    input: Omit<PromotionInput, 'targetCompanyIds'>,
  ): Prisma.PromotionUncheckedCreateInput {
    return {
      slug: input.slug,
      name: input.name,
      description: input.description,
      status: input.status,
      scope: input.scope,
      discountType: input.discountType ?? null,
      discountValue: input.discountValue ?? null,
      minOrderTotal: input.minOrderTotal ?? null,
      currency: input.currency,
      startsAt: input.startsAt ? new Date(input.startsAt) : null,
      endsAt: input.endsAt ? new Date(input.endsAt) : null,
      bannerId: input.bannerId ?? null,
    };
  }

  private toPromotionUpdate(
    input: Omit<PromotionInput, 'targetCompanyIds'>,
  ): Prisma.PromotionUncheckedUpdateInput {
    return this.toPromotionCreate(input);
  }

  private toBannerCreate(input: BannerInput): Prisma.BannerUncheckedCreateInput {
    return {
      placement: input.placement,
      title: input.title,
      subtitle: input.subtitle,
      ctaLabel: input.ctaLabel,
      ctaHref: input.ctaHref,
      imageUrl: input.imageUrl,
      imageAlt: input.imageAlt,
      isActive: input.isActive,
      startsAt: input.startsAt ? new Date(input.startsAt) : null,
      endsAt: input.endsAt ? new Date(input.endsAt) : null,
      sortOrder: input.sortOrder,
    };
  }

  private toBannerUpdate(input: BannerInput): Prisma.BannerUncheckedUpdateInput {
    return this.toBannerCreate(input);
  }

  private async assertSlugFree(slug: string) {
    const exists = await this.prisma.promotion.findUnique({ where: { slug } });
    if (exists) throw new BadRequestException('Slug already in use');
  }
}
