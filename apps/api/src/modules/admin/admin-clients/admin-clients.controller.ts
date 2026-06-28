import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuditAction, UserRole } from '@prisma/client';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { Audit } from '../../audit/audit.decorator';
import { AuditInterceptor } from '../../audit/audit.interceptor';
import { CurrentUser, type AuthUser } from '../../auth/current-user.decorator';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../../auth/roles.guard';
import { AdminClientsService } from './admin-clients.service';
import {
  ApproveCompanySchema,
  ListCompaniesQuerySchema,
  RejectCompanySchema,
  SetCompanyPriceListSchema,
  type ApproveCompanyInput,
  type ListCompaniesQuery,
  type RejectCompanyInput,
  type SetCompanyPriceListInput,
} from './admin-clients.schema';

@Controller('admin/companies')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@UseInterceptors(AuditInterceptor)
export class AdminClientsController {
  constructor(private readonly service: AdminClientsService) {}

  @Get()
  list(@Query(new ZodValidationPipe(ListCompaniesQuerySchema)) q: ListCompaniesQuery) {
    return this.service.listCompanies(q);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.getCompany(id);
  }

  @Post(':id/approve')
  @Audit({ entityType: 'Company', action: AuditAction.APPROVE })
  approve(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ApproveCompanySchema)) body: ApproveCompanyInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.approve(id, user.id, body);
  }

  @Post(':id/reject')
  @Audit({ entityType: 'Company', action: AuditAction.REJECT })
  reject(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(RejectCompanySchema)) body: RejectCompanyInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.reject(id, user.id, body);
  }

  @Patch(':id/price-list')
  @Audit({ entityType: 'Company', action: AuditAction.UPDATE })
  setPriceList(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(SetCompanyPriceListSchema)) body: SetCompanyPriceListInput,
  ) {
    return this.service.setPriceList(id, body);
  }
}
