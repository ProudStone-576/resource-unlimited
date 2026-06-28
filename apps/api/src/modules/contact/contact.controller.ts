import { Body, Controller, Headers, Ip, Post, UsePipes } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CreateContactSchema, type CreateContactInput } from './contact.schema';
import { ContactService } from './contact.service';

@Controller('contact')
export class ContactController {
  constructor(private readonly service: ContactService) {}

  @Post()
  @Throttle({ quote: { ttl: 3_600_000, limit: 10 } })
  @UsePipes(new ZodValidationPipe(CreateContactSchema))
  create(
    @Body() body: CreateContactInput,
    @Ip() ip: string,
    @Headers('user-agent') ua: string,
  ) {
    return this.service.create(body, { ip, ua });
  }
}
