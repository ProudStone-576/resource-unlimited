import { Injectable } from '@nestjs/common';
import { Prisma, QuoteEventType, QuoteStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { ListAdminQuotesQueryDto } from './admin-quotes.dto';
import type { UpdateQuoteStatusInput } from './admin-quotes.schema';

@Injectable()
export class AdminQuotesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(q: ListAdminQuotesQueryDto) {
    const where: Prisma.QuoteRequestWhereInput = {};
    if (q.status) where.status = q.status;
    if (q.search) {
      where.OR = [
        { number: { contains: q.search, mode: 'insensitive' } },
        { companyName: { contains: q.search, mode: 'insensitive' } },
        { contactEmail: { contains: q.search, mode: 'insensitive' } },
        { contactName: { contains: q.search, mode: 'insensitive' } },
      ];
    }
    const skip = (q.page - 1) * q.pageSize;
    const [total, data] = await this.prisma.$transaction([
      this.prisma.quoteRequest.count({ where }),
      this.prisma.quoteRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: q.pageSize,
        include: {
          _count: { select: { items: true } },
          salesRep: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      }),
    ]);
    return { total, data };
  }

  getById(id: string) {
    return this.prisma.quoteRequest.findUnique({
      where: { id },
      include: {
        items: true,
        events: { orderBy: { createdAt: 'asc' } },
        salesRep: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async updateStatus(id: string, input: UpdateQuoteStatusInput, actorLabel: string) {
    const existing = await this.prisma.quoteRequest.findUnique({ where: { id } });
    if (!existing) return null;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.quoteRequest.update({
        where: { id },
        data: {
          status: input.status,
          totalEstimate: input.totalEstimate,
          validUntil: input.validUntil ? new Date(input.validUntil) : undefined,
        },
        include: {
          items: true,
          events: { orderBy: { createdAt: 'asc' } },
        },
      });
      await tx.quoteEvent.create({
        data: {
          quoteId: id,
          type: QuoteEventType.STATUS_CHANGED,
          fromStatus: existing.status as QuoteStatus,
          toStatus: input.status,
          message: input.message,
          actorLabel,
        },
      });
      return updated;
    });
  }

  async assign(id: string, salesRepId: string | null, actorLabel: string) {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.quoteRequest.update({
        where: { id },
        data: { salesRepId },
      });
      await tx.quoteEvent.create({
        data: {
          quoteId: id,
          type: QuoteEventType.ASSIGNED,
          message: salesRepId ? `Assigned to ${salesRepId}` : 'Unassigned',
          actorLabel,
        },
      });
      return updated;
    });
  }

  setPdfUrl(id: string, pdfUrl: string, actorLabel: string) {
    return this.prisma.$transaction([
      this.prisma.quoteRequest.update({ where: { id }, data: { quotePdfUrl: pdfUrl } }),
      this.prisma.quoteEvent.create({
        data: {
          quoteId: id,
          type: QuoteEventType.PDF_GENERATED,
          message: pdfUrl,
          actorLabel,
        },
      }),
    ]);
  }
}
