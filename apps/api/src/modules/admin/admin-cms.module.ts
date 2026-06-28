import { Module } from '@nestjs/common';
import { PortalModule } from '../portal/portal.module';
import { AdminCategoriesController } from './admin-categories/admin-categories.controller';
import { AdminCategoriesService } from './admin-categories/admin-categories.service';
import { AdminBrandsController } from './admin-brands/admin-brands.controller';
import { AdminBrandsService } from './admin-brands/admin-brands.service';
import { AdminProductsController } from './admin-products/admin-products.controller';
import { AdminProductsService } from './admin-products/admin-products.service';
import { ProductsExcelService } from './admin-products/products-excel.service';
import { AdminUploadsController } from './admin-uploads/admin-uploads.controller';
import { AdminUploadsService } from './admin-uploads/admin-uploads.service';
import { AdminOrdersController } from './admin-orders/admin-orders.controller';
import { AdminOrdersService } from './admin-orders/admin-orders.service';
import { AdminClientsController } from './admin-clients/admin-clients.controller';
import { AdminClientsService } from './admin-clients/admin-clients.service';
import { AdminPromotionsController } from './admin-promotions/admin-promotions.controller';
import { AdminPromotionsService } from './admin-promotions/admin-promotions.service';
import { AdminContentController } from './admin-content/admin-content.controller';
import { AdminContentService } from './admin-content/admin-content.service';
import { AdminAuditController } from './admin-audit/admin-audit.controller';

@Module({
  imports: [PortalModule], // for OrdersService.generateInvoice in AdminOrdersService
  controllers: [
    AdminCategoriesController,
    AdminBrandsController,
    AdminProductsController,
    AdminUploadsController,
    AdminOrdersController,
    AdminClientsController,
    AdminPromotionsController,
    AdminContentController,
    AdminAuditController,
  ],
  providers: [
    AdminCategoriesService,
    AdminBrandsService,
    AdminProductsService,
    ProductsExcelService,
    AdminUploadsService,
    AdminOrdersService,
    AdminClientsService,
    AdminPromotionsService,
    AdminContentService,
  ],
})
export class AdminCmsModule {}
