import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { PageStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Controller()
export class PublicContentController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('blog')
  listPosts() {
    return this.prisma.blogPost.findMany({
      where: { status: PageStatus.PUBLISHED },
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        coverImageUrl: true,
        tags: true,
        publishedAt: true,
      },
    });
  }

  @Get('blog/:slug')
  async getPost(@Param('slug') slug: string) {
    const post = await this.prisma.blogPost.findFirst({
      where: { slug, status: PageStatus.PUBLISHED },
      include: { author: { select: { firstName: true, lastName: true } } },
    });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  @Get('pages/:slug')
  async getPage(@Param('slug') slug: string) {
    const page = await this.prisma.page.findFirst({
      where: { slug, status: PageStatus.PUBLISHED },
    });
    if (!page) throw new NotFoundException('Page not found');
    return page;
  }
}
