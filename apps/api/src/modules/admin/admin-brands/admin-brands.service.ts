import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import type { BrandInput } from './admin-brands.schema';

@Injectable()
export class AdminBrandsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.brand.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { products: true } } },
    });
  }

  get(id: string) {
    return this.prisma.brand.findUnique({ where: { id } });
  }

  async create(input: BrandInput) {
    const exists = await this.prisma.brand.findUnique({ where: { slug: input.slug } });
    if (exists) throw new BadRequestException('Slug already in use');
    return this.prisma.brand.create({ data: input });
  }

  async update(id: string, input: BrandInput) {
    const existing = await this.prisma.brand.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Brand not found');
    if (existing.slug !== input.slug) {
      const slugTaken = await this.prisma.brand.findUnique({ where: { slug: input.slug } });
      if (slugTaken) throw new BadRequestException('Slug already in use');
    }
    return this.prisma.brand.update({ where: { id }, data: input });
  }

  async remove(id: string) {
    await this.prisma.brand.delete({ where: { id } });
    return { ok: true };
  }
}
