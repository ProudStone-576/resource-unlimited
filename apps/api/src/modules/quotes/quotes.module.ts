import { Module } from '@nestjs/common';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';
import { QuotesRepository } from './quotes.repository';
import { QuotePdfService } from './quote-pdf.service';

@Module({
  controllers: [QuotesController],
  providers: [QuotesService, QuotesRepository, QuotePdfService],
  exports: [QuotesService, QuotesRepository, QuotePdfService],
})
export class QuotesModule {}
