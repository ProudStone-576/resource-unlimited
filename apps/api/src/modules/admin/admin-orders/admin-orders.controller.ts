import { Body, Controller, Get, Param, Patch, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuditAction, UserRole } from '@prisma/client';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { Audit } from '../../audit/audit.decorator';
import { AuditInterceptor } from '../../audit/audit.interceptor';
import { CurrentUser, type AuthUser } from '../../auth/current-user.decorator';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../../auth/roles.guard';
import { AdminOrdersService } from './admin-orders.service';
import {
  ListOrdersQuerySchema,
  UpdateOrderStatusSchema,
  type ListOrdersQuery,
  type UpdateOrderStatusInput,
} from './admin-orders.schema';

@Controller('admin/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SALES_REP, UserRole.ADMIN, UserRole.SUPER_ADMIN)
@UseInterceptors(AuditInterceptor)
export class AdminOrdersController {
  constructor(private readonly service: AdminOrdersService) {}

  @Get()
  list(@Query(new ZodValidationPipe(ListOrdersQuerySchema)) q: ListOrdersQuery) {
    return this.service.list(q);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Patch(':id/status')
  @Audit({ entityType: 'Order', action: AuditAction.STATUS_CHANGE })
  updateStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateOrderStatusSchema)) body: UpdateOrderStatusInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.updateStatus(id, body, user.email);
  }
}
