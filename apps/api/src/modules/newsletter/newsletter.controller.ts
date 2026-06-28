import { Body, Controller, Get, Headers, Ip, Post, Query, UseGuards, UsePipes } from '@nestjs/common';
import { NewsletterStatus, UserRole } from '@prisma/client';
import { Throttle } from '@nestjs/throttler';
import { z } from 'zod';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { NewsletterService } from './newsletter.service';
import {
  SubscribeSchema,
  UnsubscribeSchema,
  type SubscribeInput,
  type UnsubscribeInput,
} from './newsletter.schema';

const AdminQuerySchema = z.object({
  status: z.nativeEnum(NewsletterStatus).optional(),
  search: z.string().optional(),
});

@Controller()
export class NewsletterController {
  constructor(private readonly service: NewsletterService) {}

  @Post('newsletter/subscribe')
  @Throttle({ quote: { ttl: 3_600_000, limit: 10 } })
  @UsePipes(new ZodValidationPipe(SubscribeSchema))
  subscribe(@Body() body: SubscribeInput, @Ip() ip: string, @Headers('user-agent') ua: string) {
    return this.service.subscribe(body, { ip, ua });
  }

  @Post('newsletter/unsubscribe')
  @UsePipes(new ZodValidationPipe(UnsubscribeSchema))
  unsubscribe(@Body() body: UnsubscribeInput) {
    return this.service.unsubscribe(body.token);
  }

  @Get('admin/newsletter')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  list(@Query(new ZodValidationPipe(AdminQuerySchema)) q: z.infer<typeof AdminQuerySchema>) {
    return this.service.list(q);
  }
}
