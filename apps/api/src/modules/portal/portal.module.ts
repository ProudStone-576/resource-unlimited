import { Module } from '@nestjs/common';
import { AddressesController } from './addresses/addresses.controller';
import { AddressesService } from './addresses/addresses.service';
import { FavoritesController } from './favorites/favorites.controller';
import { FavoritesService } from './favorites/favorites.service';
import { OrdersController } from './orders/orders.controller';
import { OrdersService } from './orders/orders.service';
import { InvoicePdfService } from './orders/invoice-pdf.service';
import { MyQuotesController } from './my-quotes/my-quotes.controller';
import { MyQuotesService } from './my-quotes/my-quotes.service';
import { CompanyController } from './company/company.controller';
import { CompanyService } from './company/company.service';
import { PortalContextService } from './portal-context.service';
import { PricingService } from './pricing.service';
import { PromotionsEngineService } from './promotions-engine.service';

@Module({
  controllers: [
    AddressesController,
    FavoritesController,
    OrdersController,
    MyQuotesController,
    CompanyController,
  ],
  providers: [
    PortalContextService,
    PricingService,
    PromotionsEngineService,
    AddressesService,
    FavoritesService,
    OrdersService,
    InvoicePdfService,
    MyQuotesService,
    CompanyService,
  ],
  exports: [PortalContextService, PricingService, PromotionsEngineService, OrdersService, InvoicePdfService],
})
export class PortalModule {}
