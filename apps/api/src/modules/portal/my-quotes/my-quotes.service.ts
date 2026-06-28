import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PortalContextService } from '../portal-context.service';

@Injectable()
export class MyQuotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: PortalContextService,
  ) {}

  /**
   * Lists quotes belonging to the signed-in user. Matches either:
   *   - submittedByUserId == userId (later phases set this on portal-submitted)
   *   - contactEmail == user.email (Phase 2 lead-capture quotes)
   */
  async list(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.quoteRequest.findMany({
      where: {
        OR: [{ submittedByUserId: userId }, { contactEmail: user.email }],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { items: true } },
      },
    });
  }

  async get(userId: string, id: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const quote = await this.prisma.quoteRequest.findUnique({
      where: { id },
      include: { items: true, events: { orderBy: { createdAt: 'asc' } } },
    });
    if (!quote) throw new NotFoundException('Quote not found');
    if (quote.submittedByUserId !== userId && quote.contactEmail !== user.email) {
      throw new ForbiddenException('Not your quote');
    }
    return quote;
  }
}
