import { Controller, Get, Query } from '@nestjs/common';
import { BannerPlacement } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('promotions')
export class PublicPromotionsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('banners')
  async listActiveBanners(@Query('placement') placement?: BannerPlacement) {
    const now = new Date();
    return this.prisma.banner.findMany({
      where: {
        isActive: true,
        ...(placement ? { placement } : {}),
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      orderBy: [{ placement: 'asc' }, { sortOrder: 'asc' }],
    });
  }
}
