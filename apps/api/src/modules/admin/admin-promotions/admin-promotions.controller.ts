import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuditAction, UserRole } from '@prisma/client';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { Audit } from '../../audit/audit.decorator';
import { AuditInterceptor } from '../../audit/audit.interceptor';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../../auth/roles.guard';
import { AdminPromotionsService } from './admin-promotions.service';
import {
  BannerInputSchema,
  PromotionInputSchema,
  type BannerInput,
  type PromotionInput,
} from './admin-promotions.schema';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@UseInterceptors(AuditInterceptor)
export class AdminPromotionsController {
  constructor(private readonly service: AdminPromotionsService) {}

  @Get('promotions')
  listPromotions() {
    return this.service.listPromotions();
  }

  @Get('promotions/:id')
  getPromotion(@Param('id') id: string) {
    return this.service.getPromotion(id);
  }

  @Post('promotions')
  @Audit({ entityType: 'Promotion', action: AuditAction.CREATE })
  createPromotion(@Body(new ZodValidationPipe(PromotionInputSchema)) body: PromotionInput) {
    return this.service.createPromotion(body);
  }

  @Patch('promotions/:id')
  @Audit({ entityType: 'Promotion', action: AuditAction.UPDATE })
  updatePromotion(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(PromotionInputSchema)) body: PromotionInput,
  ) {
    return this.service.updatePromotion(id, body);
  }

  @Delete('promotions/:id')
  @Audit({ entityType: 'Promotion', action: AuditAction.DELETE })
  removePromotion(@Param('id') id: string) {
    return this.service.removePromotion(id);
  }

  @Get('banners')
  listBanners() {
    return this.service.listBanners();
  }

  @Get('banners/:id')
  getBanner(@Param('id') id: string) {
    return this.service.getBanner(id);
  }

  @Post('banners')
  @Audit({ entityType: 'Banner', action: AuditAction.CREATE })
  createBanner(@Body(new ZodValidationPipe(BannerInputSchema)) body: BannerInput) {
    return this.service.createBanner(body);
  }

  @Patch('banners/:id')
  @Audit({ entityType: 'Banner', action: AuditAction.UPDATE })
  updateBanner(@Param('id') id: string, @Body(new ZodValidationPipe(BannerInputSchema)) body: BannerInput) {
    return this.service.updateBanner(id, body);
  }

  @Delete('banners/:id')
  @Audit({ entityType: 'Banner', action: AuditAction.DELETE })
  removeBanner(@Param('id') id: string) {
    return this.service.removeBanner(id);
  }
}
