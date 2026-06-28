import { Controller, Get, Param, Query } from '@nestjs/common';
import { ListProductsQueryDto } from './products.dto';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Get()
  list(@Query() q: ListProductsQueryDto) {
    return this.service.list(q);
  }

  @Get(':slug')
  bySlug(@Param('slug') slug: string) {
    return this.service.getBySlug(slug);
  }
}
