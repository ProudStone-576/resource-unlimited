import { Injectable } from '@nestjs/common';
import { QuoteEventType, QuoteStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateQuoteInput } from './quotes.schema';

@Injectable()
export class QuotesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    input: CreateQuoteInput,
    meta: { ip?: string; ua?: string; viewToken: string },
  ) {
    const year = new Date().getFullYear();
    const count = await this.prisma.quoteRequest.count({
      where: { createdAt: { gte: new Date(`${year}-01-01T00:00:00Z`) } },
    });
    const number = `Q-${year}-${String(count + 1).padStart(6, '0')}`;

    return this.prisma.quoteRequest.create({
      data: {
        number,
        viewToken: meta.viewToken,
        companyName: input.companyName,
        contactName: input.contactName,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        country: input.country ?? 'CA',
        province: input.province,
        city: input.city,
        postalCode: input.postalCode,
        notes: input.notes,
        source: input.source,
        ipAddress: meta.ip,
        userAgent: meta.ua,
        items: {
          create: input.items.map((it) => ({
            productId: it.productId,
            productSku: it.productSku,
            productName: it.productName,
            quantity: it.quantity,
            notes: it.notes,
          })),
        },
        events: {
          create: [
            {
              type: QuoteEventType.CREATED,
              toStatus: QuoteStatus.NEW,
              actorLabel: 'public-form',
            },
          ],
        },
      },
      include: { items: true },
    });
  }

  setPdfUrl(id: string, pdfUrl: string) {
    return this.prisma.$transaction([
      this.prisma.quoteRequest.update({ where: { id }, data: { quotePdfUrl: pdfUrl } }),
      this.prisma.quoteEvent.create({
        data: {
          quoteId: id,
          type: QuoteEventType.PDF_GENERATED,
          actorLabel: 'system',
          message: pdfUrl,
        },
      }),
    ]);
  }

  findByNumberAndToken(number: string, viewToken: string) {
    return this.prisma.quoteRequest.findFirst({
      where: { number, viewToken },
      include: {
        items: true,
        events: { orderBy: { createdAt: 'asc' } },
      },
    });
  }
}
