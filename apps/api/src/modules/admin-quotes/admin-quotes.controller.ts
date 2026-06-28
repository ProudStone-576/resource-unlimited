import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { UserRole } from '@prisma/client';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { AdminQuotesService } from './admin-quotes.service';
import { ListAdminQuotesQueryDto } from './admin-quotes.dto';
import {
  AssignQuoteSchema,
  UpdateQuoteStatusSchema,
  type AssignQuoteInput,
  type UpdateQuoteStatusInput,
} from './admin-quotes.schema';

@Controller('admin/quotes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SALES_REP, UserRole.ADMIN, UserRole.SUPER_ADMIN)
@SkipThrottle()
export class AdminQuotesController {
  constructor(private readonly service: AdminQuotesService) {}

  @Get()
  list(@Query() q: ListAdminQuotesQueryDto) {
    return this.service.list(q);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateQuoteStatusSchema)) body: UpdateQuoteStatusInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.updateStatus(id, body, user.email);
  }

  @Patch(':id/assign')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  assign(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(AssignQuoteSchema)) body: AssignQuoteInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.assign(id, body.salesRepId, user.email);
  }

  @Post(':id/regenerate-pdf')
  regeneratePdf(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.regeneratePdf(id, user.email);
  }
}
