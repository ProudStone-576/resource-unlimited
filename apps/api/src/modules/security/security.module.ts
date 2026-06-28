import { Global, Module } from '@nestjs/common';
import { RecaptchaService } from './recaptcha.service';
import { AdminTokenGuard } from './admin-token.guard';

@Global()
@Module({
  providers: [RecaptchaService, AdminTokenGuard],
  exports: [RecaptchaService, AdminTokenGuard],
})
export class SecurityModule {}
