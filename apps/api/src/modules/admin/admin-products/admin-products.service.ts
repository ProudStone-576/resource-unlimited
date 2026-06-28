import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProductStatus, UnitOfMeasure } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  DocumentInput,
  ImageInput,
  ListAdminProductsQuery,
  ProductInput,
} from './admin-products.schema';

@Injectable()
export class AdminProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(q: ListAdminProductsQuery) {
    const where: Prisma.ProductWhereInput = {};
    if (q.status) where.status = q.status;
    if (q.categoryId) where.categoryId = q.categoryId;
    if (q.brandId) where.brandId = q.brandId;
    if (q.search) {
      where.OR = [
        { name: { contains: q.search, mode: 'insensitive' } },
        { sku: { contains: q.search, mode: 'insensitive' } },
        { slug: { contains: q.search, mode: 'insensitive' } },
      ];
    }
    const skip = (q.page - 1) * q.pageSize;
    const [total, data] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: q.pageSize,
        include: {
          category: { select: { id: true, slug: true, name: true } },
          brandRef: { select: { id: true, slug: true, name: true } },
          _count: { select: { images: true, documents: true } },
        },
      }),
    ]);
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

  get(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        brandRef: true,
        images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] },
        documents: true,
      },
    });
  }

  async create(input: ProductInput) {
    await this.assertUnique(input.slug, input.sku);
    await this.assertCategoryExists(input.categoryId);
    if (input.brandId) await this.assertBrandExists(input.brandId);
    return this.prisma.product.create({
      data: this.toCreateData(input),
    });
  }

  async update(id: string, input: ProductInput) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Product not found');
    if (existing.slug !== input.slug || existing.sku !== input.sku) {
      await this.assertUnique(input.slug, input.sku, id);
    }
    await this.assertCategoryExists(input.categoryId);
    if (input.brandId) await this.assertBrandExists(input.brandId);
    return this.prisma.product.update({
      where: { id },
      data: this.toCreateData(input),
    });
  }

  async remove(id: string) {
    const refs = await this.prisma.orderItem.count({ where: { productId: id } });
    if (refs > 0) {
      // Soft-archive to preserve order history rather than destroy referenced rows.
      return this.prisma.product.update({
        where: { id },
        data: { status: ProductStatus.ARCHIVED },
      });
    }
    await this.prisma.product.delete({ where: { id } });
    return { ok: true };
  }

  async addImage(productId: string, input: ImageInput) {
    if (input.isPrimary) {
      await this.prisma.productImage.updateMany({
        where: { productId, isPrimary: true },
        data: { isPrimary: false },
      });
    }
    return this.prisma.productImage.create({ data: { ...input, productId } });
  }

  async removeImage(imageId: string) {
    await this.prisma.productImage.delete({ where: { id: imageId } });
    return { ok: true };
  }

  async addDocument(productId: string, input: DocumentInput) {
    return this.prisma.productDocument.create({ data: { ...input, productId } });
  }

  async removeDocument(docId: string) {
    await this.prisma.productDocument.delete({ where: { id: docId } });
    return { ok: true };
  }

  private toCreateData(input: ProductInput): Prisma.ProductUncheckedCreateInput {
    return {
      slug: input.slug,
      sku: input.sku,
      name: input.name,
      shortDesc: input.shortDesc,
      description: input.description,
      status: input.status,
      isFeatured: input.isFeatured,
      categoryId: input.categoryId,
      brandId: input.brandId ?? null,
      brand: input.brand,
      unitOfMeasure: input.unitOfMeasure,
      minOrderQty: input.minOrderQty,
      listPrice: input.listPrice ?? null,
      currency: input.currency,
      specs: (input.specs ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      dimensions: (input.dimensions ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      metaTitle: input.metaTitle,
      metaDescription: input.metaDescription,
    };
  }

  private async assertUnique(slug: string, sku: string, excludeId?: string) {
    const conflict = await this.prisma.product.findFirst({
      where: { OR: [{ slug }, { sku }], NOT: excludeId ? { id: excludeId } : undefined },
      select: { id: true, slug: true, sku: true },
    });
    if (conflict) {
      if (conflict.slug === slug) throw new BadRequestException('Slug already in use');
      throw new BadRequestException('SKU already in use');
    }
  }

  private async assertCategoryExists(id: string) {
    const cat = await this.prisma.productCategory.findUnique({ where: { id }, select: { id: true } });
    if (!cat) throw new BadRequestException('Invalid categoryId');
  }

  private async assertBrandExists(id: string) {
    const brand = await this.prisma.brand.findUnique({ where: { id }, select: { id: true } });
    if (!brand) throw new BadRequestException('Invalid brandId');
  }

  // ----------------------------------------------------------
  // Bulk
  // ----------------------------------------------------------

  buildExportRows(rows: {
    id: string;
    sku: string;
    slug: string;
    name: string;
    shortDesc: string | null;
    status: ProductStatus;
    isFeatured: boolean;
    categorySlug: string;
    brandSlug: string | null;
    unitOfMeasure: UnitOfMeasure;
    minOrderQty: number;
    listPrice: string | null;
    currency: string;
  }[]) {
    return rows;
  }

  async listForExport() {
    const products = await this.prisma.product.findMany({
      include: {
        category: { select: { slug: true } },
        brandRef: { select: { slug: true } },
      },
      orderBy: { sku: 'asc' },
    });
    return products.map((p) => ({
      id: p.id,
      sku: p.sku,
      slug: p.slug,
      name: p.name,
      shortDesc: p.shortDesc,
      status: p.status,
      isFeatured: p.isFeatured,
      categorySlug: p.category.slug,
      brandSlug: p.brandRef?.slug ?? null,
      unitOfMeasure: p.unitOfMeasure,
      minOrderQty: p.minOrderQty,
      listPrice: p.listPrice ? p.listPrice.toString() : null,
      currency: p.currency,
    }));
  }

  /**
   * Bulk upsert by SKU. Each row is validated; failures collected and
   * returned with row index so the admin sees what to fix.
   */
  async bulkUpsert(rows: Array<{
    sku: string;
    slug?: string;
    name: string;
    shortDesc?: string | null;
    description?: string | null;
    status?: ProductStatus;
    isFeatured?: boolean;
    categorySlug: string;
    brandSlug?: string | null;
    unitOfMeasure?: UnitOfMeasure;
    minOrderQty?: number;
    listPrice?: number | null;
    currency?: string;
  }>) {
    const categories = await this.prisma.productCategory.findMany({ select: { id: true, slug: true } });
    const brands = await this.prisma.brand.findMany({ select: { id: true, slug: true } });
    const catBySlug = new Map(categories.map((c) => [c.slug, c.id]));
    const brandBySlug = new Map(brands.map((b) => [b.slug, b.id]));

    const errors: { row: number; message: string }[] = [];
    let created = 0;
    let updated = 0;

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r) continue;
      try {
        const categoryId = catBySlug.get(r.categorySlug);
        if (!categoryId) throw new Error(`Unknown category slug: ${r.categorySlug}`);
        const brandId = r.brandSlug ? brandBySlug.get(r.brandSlug) ?? null : null;
        if (r.brandSlug && !brandId) throw new Error(`Unknown brand slug: ${r.brandSlug}`);
        const slug =
          r.slug ?? r.sku.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        const data: Prisma.ProductUncheckedCreateInput = {
          sku: r.sku,
          slug,
          name: r.name,
          shortDesc: r.shortDesc ?? null,
          description: r.description ?? null,
          status: r.status ?? ProductStatus.ACTIVE,
          isFeatured: r.isFeatured ?? false,
          categoryId,
          brandId,
          unitOfMeasure: r.unitOfMeasure ?? UnitOfMeasure.EACH,
          minOrderQty: r.minOrderQty ?? 1,
          listPrice: r.listPrice ?? null,
          currency: r.currency ?? 'CAD',
        };

        const existing = await this.prisma.product.findUnique({ where: { sku: r.sku } });
        if (existing) {
          await this.prisma.product.update({ where: { id: existing.id }, data });
          updated++;
        } else {
          await this.prisma.product.create({ data });
          created++;
        }
      } catch (err) {
        errors.push({ row: i + 2, message: (err as Error).message }); // +2 = header row offset
      }
    }
    return { created, updated, errors };
  }
}
