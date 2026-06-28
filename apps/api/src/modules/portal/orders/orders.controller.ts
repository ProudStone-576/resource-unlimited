import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { OrderStatus, UserRole } from '@prisma/client';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { CurrentUser, type AuthUser } from '../../auth/current-user.decorator';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../../auth/roles.guard';
import { OrdersService } from './orders.service';
import { CreateOrderSchema, type CreateOrderInput } from './orders.schema';

const ReorderSchema = z.object({
  shippingAddressId: z.string().min(1),
});

const CancelSchema = z.object({
  message: z.string().max(500).optional(),
});

@Controller('portal/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CLIENT, UserRole.SALES_REP, UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class OrdersController {
  constructor(private readonly service: OrdersService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.service.list(user.id);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.get(user.id, id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(CreateOrderSchema)) body: CreateOrderInput,
  ) {
    return this.service.create(user.id, body);
  }

  @Post(':id/reorder')
  reorder(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ReorderSchema)) body: { shippingAddressId: string },
  ) {
    return this.service.reorder(user.id, id, body.shippingAddressId);
  }

  @Patch(':id/cancel')
  cancel(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(CancelSchema)) body: { message?: string },
  ) {
    return this.service.updateStatus(user.id, 'self', id, OrderStatus.CANCELLED, body.message);
  }

  @Get('invoices/list')
  listInvoices(@CurrentUser() user: AuthUser) {
    return this.service.listInvoices(user.id);
  }

  @Get('invoices/:id')
  getInvoice(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.getInvoice(user.id, id);
  }
}
