import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuditAction, UserRole } from '@prisma/client';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { Audit } from '../../audit/audit.decorator';
import { AuditInterceptor } from '../../audit/audit.interceptor';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../../auth/roles.guard';
import { AdminCategoriesService } from './admin-categories.service';
import {
  CategoryInputSchema,
  CategoryReorderSchema,
  type CategoryInput,
  type CategoryReorderInput,
} from './admin-categories.schema';

@Controller('admin/categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@UseInterceptors(AuditInterceptor)
export class AdminCategoriesController {
  constructor(private readonly service: AdminCategoriesService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Post()
  @Audit({ entityType: 'ProductCategory', action: AuditAction.CREATE })
  create(@Body(new ZodValidationPipe(CategoryInputSchema)) body: CategoryInput) {
    return this.service.create(body);
  }

  @Patch(':id')
  @Audit({ entityType: 'ProductCategory', action: AuditAction.UPDATE })
  update(@Param('id') id: string, @Body(new ZodValidationPipe(CategoryInputSchema)) body: CategoryInput) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @Audit({ entityType: 'ProductCategory', action: AuditAction.DELETE })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post('reorder')
  @Audit({ entityType: 'ProductCategory', action: AuditAction.UPDATE })
  reorder(@Body(new ZodValidationPipe(CategoryReorderSchema)) body: CategoryReorderInput) {
    return this.service.reorder(body);
  }
}
