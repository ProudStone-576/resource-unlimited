import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateContactInput } from './contact.schema';

@Injectable()
export class ContactRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateContactInput, meta: { ip?: string; ua?: string }) {
    return this.prisma.contactInquiry.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone,
        company: input.company,
        subject: input.subject,
        message: input.message,
        source: input.source,
        ipAddress: meta.ip,
        userAgent: meta.ua,
      },
    });
  }
}
