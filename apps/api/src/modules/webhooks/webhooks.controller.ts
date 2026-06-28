import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuditAction, UserRole } from '@prisma/client';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { Audit } from '../audit/audit.decorator';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { WebhooksService } from './webhooks.service';
import { WebhookEndpointInputSchema, type WebhookEndpointInput } from './webhooks.schema';

@Controller('admin/webhooks')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@UseInterceptors(AuditInterceptor)
export class WebhooksController {
  constructor(private readonly service: WebhooksService) {}

  @Get('endpoints')
  list() {
    return this.service.list();
  }

  @Get('endpoints/:id')
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Post('endpoints')
  @Audit({ entityType: 'WebhookEndpoint', action: AuditAction.CREATE })
  create(@Body(new ZodValidationPipe(WebhookEndpointInputSchema)) body: WebhookEndpointInput) {
    return this.service.create(body);
  }

  @Patch('endpoints/:id')
  @Audit({ entityType: 'WebhookEndpoint', action: AuditAction.UPDATE })
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(WebhookEndpointInputSchema)) body: WebhookEndpointInput,
  ) {
    return this.service.update(id, body);
  }

  @Delete('endpoints/:id')
  @Audit({ entityType: 'WebhookEndpoint', action: AuditAction.DELETE })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Get('deliveries')
  deliveries(@Query('endpointId') endpointId?: string) {
    return this.service.recentDeliveries(endpointId);
  }
}
