import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllTree() {
    return this.prisma.productCategory.findMany({
      where: { isVisible: true, parentId: null },
      orderBy: { sortOrder: 'asc' },
      include: {
        children: {
          where: { isVisible: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  findBySlug(slug: string) {
    return this.prisma.productCategory.findUnique({
      where: { slug },
      include: {
        parent: true,
        children: {
          where: { isVisible: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  findById(id: string) {
    return this.prisma.productCategory.findUnique({ where: { id } });
  }
}
