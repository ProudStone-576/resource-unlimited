import { Injectable } from '@nestjs/common';
import { DiscountType, Prisma, PromotionScope, PromotionStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface AppliedPromotion {
  promotionId: string;
  promotionName: string;
  discountType: DiscountType;
  discountValue: string;
  discountAmount: string; // computed in cart currency
}

@Injectable()
export class PromotionsEngineService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns the best-applicable promotion for the given cart context.
   * Stacking is intentionally disabled here — Phase 7 can extend.
   *
   * Rules:
   *  - Promotion must be ACTIVE (or SCHEDULED with current window)
   *  - PUBLIC scope applies to anyone; COMPANY scope requires a PromotionTarget match
   *  - minOrderTotal must be ≤ subtotal
   *  - Picks the highest discount value
   */
  async resolveForCart(input: {
    companyId: string;
    subtotal: Prisma.Decimal;
    currency: string;
  }): Promise<AppliedPromotion | null> {
    const now = new Date();

    const candidates = await this.prisma.promotion.findMany({
      where: {
        OR: [{ status: PromotionStatus.ACTIVE }, { status: PromotionStatus.SCHEDULED }],
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
        currency: input.currency,
      },
      include: { targets: true },
    });
    if (candidates.length === 0) return null;

    const applicable = candidates.filter((p) => {
      if (p.discountType === null || p.discountValue === null) return false;
      if (p.minOrderTotal && new Prisma.Decimal(input.subtotal).lessThan(p.minOrderTotal)) return false;
      if (p.scope === PromotionScope.PUBLIC) return true;
      // COMPANY scope — must include this company in targets.
      return p.targets.some((t) => t.companyId === input.companyId);
    });
    if (applicable.length === 0) return null;

    const scored = applicable.map((p) => {
      const value = new Prisma.Decimal(p.discountValue ?? 0);
      const amount =
        p.discountType === DiscountType.PERCENT
          ? input.subtotal.mul(value).div(100)
          : value;
      return { p, amount };
    });
    scored.sort((a, b) => (a.amount.lessThan(b.amount) ? 1 : -1));
    const best = scored[0];
    if (!best || best.amount.lessThanOrEqualTo(0)) return null;

    return {
      promotionId: best.p.id,
      promotionName: best.p.name,
      discountType: best.p.discountType as DiscountType,
      discountValue: (best.p.discountValue as Prisma.Decimal).toString(),
      discountAmount: best.amount.toFixed(2),
    };
  }
}
