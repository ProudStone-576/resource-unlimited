import { Body, Controller, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuditAction, UserRole } from '@prisma/client';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { Audit } from '../../audit/audit.decorator';
import { AuditInterceptor } from '../../audit/audit.interceptor';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../../auth/roles.guard';
import { AdminUploadsService } from './admin-uploads.service';
import {
  SignCloudinarySchema,
  SignS3PutSchema,
  type SignCloudinaryInput,
  type SignS3PutInput,
} from './admin-uploads.schema';

@Controller('admin/uploads')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@UseInterceptors(AuditInterceptor)
export class AdminUploadsController {
  constructor(private readonly service: AdminUploadsService) {}

  @Post('cloudinary/sign')
  @Audit({ entityType: 'Upload', action: AuditAction.UPLOAD_SIGNED })
  cloudinary(@Body(new ZodValidationPipe(SignCloudinarySchema)) body: SignCloudinaryInput) {
    return this.service.signCloudinary(body);
  }

  @Post('s3/sign-put')
  @Audit({ entityType: 'Upload', action: AuditAction.UPLOAD_SIGNED })
  s3Put(@Body(new ZodValidationPipe(SignS3PutSchema)) body: SignS3PutInput) {
    return this.service.signS3Put(body);
  }
}
