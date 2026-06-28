import { Body, Controller, Get, Headers, Ip, Param, Post, Query, UsePipes } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CreateQuoteSchema, type CreateQuoteInput } from './quotes.schema';
import { QuotesService } from './quotes.service';

@Controller('quotes')
export class QuotesController {
  constructor(private readonly service: QuotesService) {}

  @Post()
  @Throttle({ quote: { ttl: 3_600_000, limit: 5 } })
  @UsePipes(new ZodValidationPipe(CreateQuoteSchema))
  create(
    @Body() body: CreateQuoteInput,
    @Ip() ip: string,
    @Headers('user-agent') ua: string,
  ) {
    return this.service.create(body, { ip, ua });
  }

  @Get('track/:number')
  track(@Param('number') number: string, @Query('token') token: string) {
    return this.service.track(number, token ?? '');
  }
}
