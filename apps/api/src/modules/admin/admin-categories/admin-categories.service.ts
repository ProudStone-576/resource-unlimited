import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import type { CategoryInput, CategoryReorderInput } from './admin-categories.schema';

@Injectable()
export class AdminCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.productCategory.findMany({
      orderBy: [{ parentId: 'asc' }, { sortOrder: 'asc' }],
      include: { _count: { select: { products: true, children: true } } },
    });
  }

  get(id: string) {
    return this.prisma.productCategory.findUnique({
      where: { id },
      include: { parent: true, children: true },
    });
  }

  async create(input: CategoryInput) {
    await this.assertSlugFree(input.slug);
    if (input.parentId) await this.assertNoCycle(null, input.parentId);
    return this.prisma.productCategory.create({ data: input });
  }

  async update(id: string, input: CategoryInput) {
    const existing = await this.prisma.productCategory.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Category not found');
    if (existing.slug !== input.slug) await this.assertSlugFree(input.slug);
    if (input.parentId && input.parentId !== existing.parentId) {
      await this.assertNoCycle(id, input.parentId);
    }
    return this.prisma.productCategory.update({ where: { id }, data: input });
  }

  async remove(id: string) {
    const productCount = await this.prisma.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      throw new BadRequestException(`Cannot delete: ${productCount} products use this category`);
    }
    await this.prisma.productCategory.delete({ where: { id } });
    return { ok: true };
  }

  async reorder(input: CategoryReorderInput) {
    await this.prisma.$transaction(
      input.items.map((it) =>
        this.prisma.productCategory.update({
          where: { id: it.id },
          data: {
            sortOrder: it.sortOrder,
            ...(it.parentId !== undefined ? { parentId: it.parentId } : {}),
          },
        }),
      ),
    );
    return { ok: true };
  }

  private async assertSlugFree(slug: string) {
    const exists = await this.prisma.productCategory.findUnique({ where: { slug } });
    if (exists) throw new BadRequestException('Slug already in use');
  }

  private async assertNoCycle(thisId: string | null, parentId: string) {
    let cur: string | null = parentId;
    const seen = new Set<string>();
    while (cur) {
      if (thisId && cur === thisId) {
        throw new BadRequestException('Parent would create a cycle');
      }
      if (seen.has(cur)) break;
      seen.add(cur);
      const parent: { parentId: string | null } | null = await this.prisma.productCategory.findUnique({
        where: { id: cur },
        select: { parentId: true },
      });
      cur = parent?.parentId ?? null;
    }
  }
}
