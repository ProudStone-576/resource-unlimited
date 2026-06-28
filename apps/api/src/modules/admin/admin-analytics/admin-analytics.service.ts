import { Injectable } from '@nestjs/common';
import { Prisma, QuoteStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

export interface DateRange {
  from: Date;
  to: Date;
}

export interface OverviewResult {
  range: { from: string; to: string };
  revenue: { currency: string; total: string; count: number; avgOrderValue: string };
  orders: { byStatus: Record<string, number> };
  quotes: { total: number; quoted: number; won: number; conversionPct: number };
  topProducts: { productSku: string; productName: string; quantity: number; revenue: string }[];
  topReps: { userId: string; email: string; quotesAssigned: number; quotesWon: number }[];
}

@Injectable()
export class AdminAnalyticsService {
  private cache = new Map<string, { at: number; data: OverviewResult }>();

  constructor(private readonly prisma: PrismaService) {}

  async overview(range: DateRange, ttlSec = 120): Promise<OverviewResult> {
    const key = `${range.from.toISOString()}|${range.to.toISOString()}`;
    const hit = this.cache.get(key);
    if (hit && Date.now() - hit.at < ttlSec * 1000) return hit.data;

    const dateFilter = { gte: range.from, lte: range.to };

    const [revenueAgg, orderCount, ordersByStatus, quotes, topProducts, topReps] = await Promise.all([
      this.prisma.order.aggregate({
        where: { createdAt: dateFilter, status: { notIn: ['CANCELLED'] } },
        _sum: { grandTotal: true },
        _avg: { grandTotal: true },
      }),
      this.prisma.order.count({ where: { createdAt: dateFilter, status: { notIn: ['CANCELLED'] } } }),
      this.prisma.order.groupBy({
        by: ['status'],
        where: { createdAt: dateFilter },
        _count: { _all: true },
      }),
      this.prisma.$transaction([
        this.prisma.quoteRequest.count({ where: { createdAt: dateFilter } }),
        this.prisma.quoteRequest.count({ where: { createdAt: dateFilter, status: QuoteStatus.QUOTED } }),
        this.prisma.quoteRequest.count({ where: { createdAt: dateFilter, status: QuoteStatus.WON } }),
      ]),
      this.topProductsByRevenue(range),
      this.topRepsByActivity(range),
    ]);

    const total = (revenueAgg._sum.grandTotal ?? new Prisma.Decimal(0)).toString();
    const avg = (revenueAgg._avg.grandTotal ?? new Prisma.Decimal(0)).toString();
    const [qTotal, qQuoted, qWon] = quotes;
    const conversionPct = qTotal > 0 ? Math.round((qWon / qTotal) * 1000) / 10 : 0;

    const result: OverviewResult = {
      range: { from: range.from.toISOString(), to: range.to.toISOString() },
      revenue: { currency: 'CAD', total, count: orderCount, avgOrderValue: avg },
      orders: {
        byStatus: Object.fromEntries(ordersByStatus.map((s) => [s.status, s._count._all])),
      },
      quotes: { total: qTotal, quoted: qQuoted, won: qWon, conversionPct },
      topProducts,
      topReps,
    };
    this.cache.set(key, { at: Date.now(), data: result });
    return result;
  }

  private async topProductsByRevenue(range: DateRange) {
    const rows = await this.prisma.orderItem.groupBy({
      by: ['productSku', 'productName'],
      where: { order: { createdAt: { gte: range.from, lte: range.to }, status: { notIn: ['CANCELLED'] } } },
      _sum: { quantity: true, lineTotal: true },
      orderBy: { _sum: { lineTotal: 'desc' } },
      take: 10,
    });
    return rows.map((r) => ({
      productSku: r.productSku,
      productName: r.productName,
      quantity: r._sum.quantity ?? 0,
      revenue: (r._sum.lineTotal ?? new Prisma.Decimal(0)).toString(),
    }));
  }

  private async topRepsByActivity(range: DateRange) {
    const rows = await this.prisma.quoteRequest.groupBy({
      by: ['salesRepId'],
      where: { createdAt: { gte: range.from, lte: range.to }, salesRepId: { not: null } },
      _count: { _all: true },
    });
    if (rows.length === 0) return [];
    const ids = rows.map((r) => r.salesRepId).filter((v): v is string => Boolean(v));
    const users = await this.prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, email: true },
    });
    const byId = new Map(users.map((u) => [u.id, u]));

    const wonRows = await this.prisma.quoteRequest.groupBy({
      by: ['salesRepId'],
      where: {
        createdAt: { gte: range.from, lte: range.to },
        status: QuoteStatus.WON,
        salesRepId: { in: ids },
      },
      _count: { _all: true },
    });
    const wonById = new Map(wonRows.map((r) => [r.salesRepId, r._count._all]));

    return rows
      .map((r) => {
        const u = r.salesRepId ? byId.get(r.salesRepId) : null;
        if (!u) return null;
        return {
          userId: u.id,
          email: u.email,
          quotesAssigned: r._count._all,
          quotesWon: wonById.get(r.salesRepId) ?? 0,
        };
      })
      .filter((v): v is NonNullable<typeof v> => v !== null)
      .sort((a, b) => b.quotesAssigned - a.quotesAssigned)
      .slice(0, 10);
  }
}
