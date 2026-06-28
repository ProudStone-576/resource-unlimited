import { Controller, Get, Param } from '@nestjs/common';
import { CategoriesService } from './categories.service';

@Controller('products/categories')
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Get(':slug')
  bySlug(@Param('slug') slug: string) {
    return this.service.getBySlug(slug);
  }
}
