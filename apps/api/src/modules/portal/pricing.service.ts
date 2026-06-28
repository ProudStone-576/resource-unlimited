import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface ResolvedPrice {
  productId: string;
  unitPrice: Prisma.Decimal;
  currency: string;
  source: 'CLIENT_OVERRIDE' | 'PRICE_LIST' | 'LIST_PRICE' | 'NONE';
  minQty: number;
}

/**
 * Resolves the effective unit price for a (company, product) pair.
 *
 * Precedence:
 *   1. Company-level `ClientPrice` override (most specific)
 *   2. Company's `PriceList` → `ClientPrice` for that product
 *   3. Product's `listPrice` (admin-set default)
 *   4. NONE — quote-only product
 */
@Injectable()
export class PricingService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveForCompany(companyId: string, productIds: string[]): Promise<Map<string, ResolvedPrice>> {
    if (productIds.length === 0) return new Map();

    const [company, products, companyOverrides] = await this.prisma.$transaction([
      this.prisma.company.findUnique({ where: { id: companyId }, select: { priceListId: true } }),
      this.prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, listPrice: true, currency: true, minOrderQty: true },
      }),
      this.prisma.clientPrice.findMany({
        where: { companyId, productId: { in: productIds } },
      }),
    ]);

    const listPrices = company?.priceListId
      ? await this.prisma.clientPrice.findMany({
          where: { priceListId: company.priceListId, productId: { in: productIds } },
        })
      : [];

    const overrideByProduct = new Map(companyOverrides.map((p) => [p.productId, p]));
    const listByProduct = new Map(listPrices.map((p) => [p.productId, p]));

    const now = new Date();
    const isCurrent = (validFrom: Date | null, validTo: Date | null) => {
      if (validFrom && validFrom > now) return false;
      if (validTo && validTo < now) return false;
      return true;
    };

    const out = new Map<string, ResolvedPrice>();
    for (const product of products) {
      const override = overrideByProduct.get(product.id);
      if (override && isCurrent(override.validFrom, override.validTo)) {
        out.set(product.id, {
          productId: product.id,
          unitPrice: override.unitPrice,
          currency: override.currency,
          source: 'CLIENT_OVERRIDE',
          minQty: override.minQty,
        });
        continue;
      }
      const list = listByProduct.get(product.id);
      if (list && isCurrent(list.validFrom, list.validTo)) {
        out.set(product.id, {
          productId: product.id,
          unitPrice: list.unitPrice,
          currency: list.currency,
          source: 'PRICE_LIST',
          minQty: list.minQty,
        });
        continue;
      }
      if (product.listPrice) {
        out.set(product.id, {
          productId: product.id,
          unitPrice: product.listPrice,
          currency: product.currency,
          source: 'LIST_PRICE',
          minQty: product.minOrderQty,
        });
        continue;
      }
      out.set(product.id, {
        productId: product.id,
        unitPrice: new Prisma.Decimal(0),
        currency: product.currency,
        source: 'NONE',
        minQty: product.minOrderQty,
      });
    }
    return out;
  }
}
