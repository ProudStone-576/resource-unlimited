import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PageStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type { BlogPostInput, PageInput } from './admin-content.schema';

@Injectable()
export class AdminContentService {
  constructor(private readonly prisma: PrismaService) {}

  listPages() {
    return this.prisma.page.findMany({ orderBy: { updatedAt: 'desc' } });
  }
  getPage(id: string) {
    return this.prisma.page.findUnique({ where: { id } });
  }
  async createPage(input: PageInput) {
    const exists = await this.prisma.page.findUnique({ where: { slug: input.slug } });
    if (exists) throw new BadRequestException('Slug already in use');
    return this.prisma.page.create({ data: this.toPageData(input) });
  }
  async updatePage(id: string, input: PageInput) {
    const existing = await this.prisma.page.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Page not found');
    if (existing.slug !== input.slug) {
      const t = await this.prisma.page.findUnique({ where: { slug: input.slug } });
      if (t) throw new BadRequestException('Slug already in use');
    }
    return this.prisma.page.update({ where: { id }, data: this.toPageData(input) });
  }
  async removePage(id: string) {
    await this.prisma.page.delete({ where: { id } });
    return { ok: true };
  }

  listPosts() {
    return this.prisma.blogPost.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { author: { select: { id: true, email: true, firstName: true, lastName: true } } },
    });
  }
  getPost(id: string) {
    return this.prisma.blogPost.findUnique({ where: { id } });
  }
  async createPost(input: BlogPostInput, authorUserId: string) {
    const exists = await this.prisma.blogPost.findUnique({ where: { slug: input.slug } });
    if (exists) throw new BadRequestException('Slug already in use');
    return this.prisma.blogPost.create({
      data: { ...this.toPostData(input), authorUserId },
    });
  }
  async updatePost(id: string, input: BlogPostInput) {
    const existing = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Post not found');
    if (existing.slug !== input.slug) {
      const t = await this.prisma.blogPost.findUnique({ where: { slug: input.slug } });
      if (t) throw new BadRequestException('Slug already in use');
    }
    return this.prisma.blogPost.update({ where: { id }, data: this.toPostData(input) });
  }
  async removePost(id: string) {
    await this.prisma.blogPost.delete({ where: { id } });
    return { ok: true };
  }

  private toPageData(input: PageInput) {
    return {
      slug: input.slug,
      title: input.title,
      body: input.body,
      status: input.status,
      metaTitle: input.metaTitle,
      metaDescription: input.metaDescription,
      publishedAt:
        input.publishedAt !== undefined
          ? input.publishedAt
            ? new Date(input.publishedAt)
            : null
          : input.status === PageStatus.PUBLISHED
            ? new Date()
            : null,
    };
  }

  private toPostData(input: BlogPostInput) {
    return {
      slug: input.slug,
      title: input.title,
      excerpt: input.excerpt,
      body: input.body,
      status: input.status,
      coverImageUrl: input.coverImageUrl,
      tags: input.tags,
      metaTitle: input.metaTitle,
      metaDescription: input.metaDescription,
      publishedAt:
        input.publishedAt !== undefined
          ? input.publishedAt
            ? new Date(input.publishedAt)
            : null
          : input.status === PageStatus.PUBLISHED
            ? new Date()
            : null,
    };
  }
}
