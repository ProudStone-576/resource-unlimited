import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { MailService } from '../mail/mail.service';
import { RecaptchaService } from '../security/recaptcha.service';
import { ContactRepository } from './contact.repository';
import type { CreateContactInput } from './contact.schema';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    private readonly repo: ContactRepository,
    private readonly mail: MailService,
    private readonly recaptcha: RecaptchaService,
  ) {}

  async create(input: CreateContactInput, meta: { ip?: string; ua?: string }) {
    const verdict = await this.recaptcha.verify(input.recaptchaToken, 'contact');
    if (!verdict.ok) {
      throw new BadRequestException(`Recaptcha rejected (${verdict.reason})`);
    }

    const inquiry = await this.repo.create(input, meta);

    void this.mail
      .send({
        to: this.mail.salesInbox,
        subject: `New contact inquiry — ${inquiry.subject ?? 'No subject'}`,
        text:
          `Name: ${inquiry.name}\n` +
          `Email: ${inquiry.email}\n` +
          `Phone: ${inquiry.phone ?? '—'}\n` +
          `Company: ${inquiry.company ?? '—'}\n` +
          `Subject: ${inquiry.subject ?? '—'}\n\n` +
          `Message:\n${inquiry.message}\n`,
      })
      .catch((err) => this.logger.warn(`Contact sales-notify failed: ${(err as Error).message}`));

    return { id: inquiry.id, status: inquiry.status, createdAt: inquiry.createdAt };
  }
}
