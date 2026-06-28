import { Injectable } from '@nestjs/common';
import { Prisma, ProductStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { ListProductsQueryDto } from './products.dto';

@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(q: ListProductsQueryDto) {
    const where: Prisma.ProductWhereInput = {
      status: ProductStatus.ACTIVE,
    };
    if (q.search) {
      where.OR = [
        { name: { contains: q.search, mode: 'insensitive' } },
        { sku: { contains: q.search, mode: 'insensitive' } },
        { shortDesc: { contains: q.search, mode: 'insensitive' } },
      ];
    }
    if (q.category) {
      where.category = { slug: q.category };
    }
    if (q.brand) {
      where.brand = { equals: q.brand, mode: 'insensitive' };
    }
    if (q.featured === 'true') {
      where.isFeatured = true;
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      q.sort === 'name'
        ? { name: 'asc' }
        : q.sort === 'sku'
          ? { sku: 'asc' }
          : { createdAt: 'desc' };

    const skip = (q.page - 1) * q.pageSize;
    const [total, data] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: q.pageSize,
        include: {
          category: { select: { id: true, slug: true, name: true } },
          images: {
            orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
            take: 1,
          },
        },
      }),
    ]);
    return { total, data };
  }

  findBySlug(slug: string) {
    return this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: { include: { parent: true } },
        images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] },
        documents: true,
      },
    });
  }

  findById(id: string) {
    return this.prisma.product.findUnique({ where: { id } });
  }

  related(productId: string, categoryId: string, limit = 4) {
    return this.prisma.product.findMany({
      where: {
        status: ProductStatus.ACTIVE,
        categoryId,
        NOT: { id: productId },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        images: { take: 1, orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] },
        category: { select: { slug: true, name: true } },
      },
    });
  }
}
