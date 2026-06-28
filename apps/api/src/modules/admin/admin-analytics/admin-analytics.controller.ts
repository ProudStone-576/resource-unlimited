import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../../auth/roles.guard';
import { AdminAnalyticsService } from './admin-analytics.service';

const RangeSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  days: z.coerce.number().int().min(1).max(365).default(30),
});

@Controller('admin/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminAnalyticsController {
  constructor(
    private readonly service: AdminAnalyticsService,
    private readonly config: ConfigService,
  ) {}

  @Get('overview')
  overview(@Query(new ZodValidationPipe(RangeSchema)) q: z.infer<typeof RangeSchema>) {
    const to = q.to ? new Date(q.to) : new Date();
    const from = q.from ? new Date(q.from) : new Date(to.getTime() - q.days * 24 * 3600_000);
    const ttl = Number(this.config.get('ANALYTICS_CACHE_SEC') ?? 120);
    return this.service.overview({ from, to }, ttl);
  }
}
