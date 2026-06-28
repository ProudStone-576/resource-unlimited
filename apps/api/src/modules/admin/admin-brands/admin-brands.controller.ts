import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuditAction, UserRole } from '@prisma/client';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { Audit } from '../../audit/audit.decorator';
import { AuditInterceptor } from '../../audit/audit.interceptor';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../../auth/roles.guard';
import { AdminBrandsService } from './admin-brands.service';
import { BrandInputSchema, type BrandInput } from './admin-brands.schema';

@Controller('admin/brands')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@UseInterceptors(AuditInterceptor)
export class AdminBrandsController {
  constructor(private readonly service: AdminBrandsService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Post()
  @Audit({ entityType: 'Brand', action: AuditAction.CREATE })
  create(@Body(new ZodValidationPipe(BrandInputSchema)) body: BrandInput) {
    return this.service.create(body);
  }

  @Patch(':id')
  @Audit({ entityType: 'Brand', action: AuditAction.UPDATE })
  update(@Param('id') id: string, @Body(new ZodValidationPipe(BrandInputSchema)) body: BrandInput) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @Audit({ entityType: 'Brand', action: AuditAction.DELETE })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
