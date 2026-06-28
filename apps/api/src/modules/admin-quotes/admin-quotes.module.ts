import { Module } from '@nestjs/common';
import { QuotesModule } from '../quotes/quotes.module';
import { AdminQuotesController } from './admin-quotes.controller';
import { AdminQuotesService } from './admin-quotes.service';
import { AdminQuotesRepository } from './admin-quotes.repository';

@Module({
  imports: [QuotesModule], // for QuotePdfService
  controllers: [AdminQuotesController],
  providers: [AdminQuotesService, AdminQuotesRepository],
})
export class AdminQuotesModule {}
