import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { AuditAction, UserRole } from '@prisma/client';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { Audit } from '../../audit/audit.decorator';
import { AuditInterceptor } from '../../audit/audit.interceptor';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../../auth/roles.guard';
import { AdminProductsService } from './admin-products.service';
import { ProductsExcelService } from './products-excel.service';
import {
  DocumentInputSchema,
  ImageInputSchema,
  ListAdminProductsQuerySchema,
  ProductInputSchema,
  type DocumentInput,
  type ImageInput,
  type ListAdminProductsQuery,
  type ProductInput,
} from './admin-products.schema';

interface MulterFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@Controller('admin/products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@UseInterceptors(AuditInterceptor)
export class AdminProductsController {
  constructor(
    private readonly service: AdminProductsService,
    private readonly excel: ProductsExcelService,
  ) {}

  @Get()
  list(@Query(new ZodValidationPipe(ListAdminProductsQuerySchema)) q: ListAdminProductsQuery) {
    return this.service.list(q);
  }

  @Get('export.xlsx')
  @Audit({ entityType: 'Product', action: AuditAction.EXPORT })
  async export(@Res() res: Response) {
    const rows = await this.service.listForExport();
    const buf = await this.excel.writeWorkbook(rows);
    res.setHeader('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('content-disposition', `attachment; filename="products-${new Date().toISOString().slice(0, 10)}.xlsx"`);
    res.send(buf);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  @Audit({ entityType: 'Product', action: AuditAction.IMPORT })
  async import(@UploadedFile() file: MulterFile) {
    if (!file?.buffer) throw new Error('No file uploaded');
    const rows = await this.excel.readWorkbook(file.buffer);
    return this.service.bulkUpsert(rows);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Post()
  @Audit({ entityType: 'Product', action: AuditAction.CREATE })
  create(@Body(new ZodValidationPipe(ProductInputSchema)) body: ProductInput) {
    return this.service.create(body);
  }

  @Patch(':id')
  @Audit({ entityType: 'Product', action: AuditAction.UPDATE })
  update(@Param('id') id: string, @Body(new ZodValidationPipe(ProductInputSchema)) body: ProductInput) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @Audit({ entityType: 'Product', action: AuditAction.DELETE })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post(':id/images')
  @Audit({ entityType: 'ProductImage', action: AuditAction.CREATE })
  addImage(@Param('id') id: string, @Body(new ZodValidationPipe(ImageInputSchema)) body: ImageInput) {
    return this.service.addImage(id, body);
  }

  @Delete('images/:imageId')
  @Audit({ entityType: 'ProductImage', action: AuditAction.DELETE })
  removeImage(@Param('imageId') imageId: string) {
    return this.service.removeImage(imageId);
  }

  @Post(':id/documents')
  @Audit({ entityType: 'ProductDocument', action: AuditAction.CREATE })
  addDocument(@Param('id') id: string, @Body(new ZodValidationPipe(DocumentInputSchema)) body: DocumentInput) {
    return this.service.addDocument(id, body);
  }

  @Delete('documents/:docId')
  @Audit({ entityType: 'ProductDocument', action: AuditAction.DELETE })
  removeDocument(@Param('docId') docId: string) {
    return this.service.removeDocument(docId);
  }
}
