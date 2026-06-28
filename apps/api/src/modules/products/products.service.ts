import { Injectable, NotFoundException } from '@nestjs/common';
import type { PaginatedResult } from '../../common/dto/pagination.dto';
import { ListProductsQueryDto } from './products.dto';
import { ProductsRepository } from './products.repository';

@Injectable()
export class ProductsService {
  constructor(private readonly repo: ProductsRepository) {}

  async list(q: ListProductsQueryDto): Promise<PaginatedResult<unknown>> {
    const { total, data } = await this.repo.list(q);
    return {
      data,
      meta: {
        page: q.page,
        pageSize: q.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / q.pageSize)),
      },
    };
  }

  async getBySlug(slug: string) {
    const product = await this.repo.findBySlug(slug);
    if (!product) throw new NotFoundException(`Product "${slug}" not found`);
    const related = await this.repo.related(product.id, product.categoryId);
    return { product, related };
  }
}
