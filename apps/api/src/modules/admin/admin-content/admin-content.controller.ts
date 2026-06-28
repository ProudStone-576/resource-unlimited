import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuditAction, UserRole } from '@prisma/client';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { Audit } from '../../audit/audit.decorator';
import { AuditInterceptor } from '../../audit/audit.interceptor';
import { CurrentUser, type AuthUser } from '../../auth/current-user.decorator';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../../auth/roles.guard';
import { AdminContentService } from './admin-content.service';
import {
  BlogPostInputSchema,
  PageInputSchema,
  type BlogPostInput,
  type PageInput,
} from './admin-content.schema';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@UseInterceptors(AuditInterceptor)
export class AdminContentController {
  constructor(private readonly service: AdminContentService) {}

  @Get('pages')
  listPages() {
    return this.service.listPages();
  }
  @Get('pages/:id')
  getPage(@Param('id') id: string) {
    return this.service.getPage(id);
  }
  @Post('pages')
  @Audit({ entityType: 'Page', action: AuditAction.CREATE })
  createPage(@Body(new ZodValidationPipe(PageInputSchema)) body: PageInput) {
    return this.service.createPage(body);
  }
  @Patch('pages/:id')
  @Audit({ entityType: 'Page', action: AuditAction.UPDATE })
  updatePage(@Param('id') id: string, @Body(new ZodValidationPipe(PageInputSchema)) body: PageInput) {
    return this.service.updatePage(id, body);
  }
  @Delete('pages/:id')
  @Audit({ entityType: 'Page', action: AuditAction.DELETE })
  removePage(@Param('id') id: string) {
    return this.service.removePage(id);
  }

  @Get('blog')
  listPosts() {
    return this.service.listPosts();
  }
  @Get('blog/:id')
  getPost(@Param('id') id: string) {
    return this.service.getPost(id);
  }
  @Post('blog')
  @Audit({ entityType: 'BlogPost', action: AuditAction.CREATE })
  createPost(
    @Body(new ZodValidationPipe(BlogPostInputSchema)) body: BlogPostInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.createPost(body, user.id);
  }
  @Patch('blog/:id')
  @Audit({ entityType: 'BlogPost', action: AuditAction.UPDATE })
  updatePost(@Param('id') id: string, @Body(new ZodValidationPipe(BlogPostInputSchema)) body: BlogPostInput) {
    return this.service.updatePost(id, body);
  }
  @Delete('blog/:id')
  @Audit({ entityType: 'BlogPost', action: AuditAction.DELETE })
  removePost(@Param('id') id: string) {
    return this.service.removePost(id);
  }
}
