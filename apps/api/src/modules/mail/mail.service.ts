import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';

export interface MailMessage {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('MAIL_HOST');
    const port = this.config.get<number>('MAIL_PORT');
    if (host && port) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user: this.config.get<string>('MAIL_USER'),
          pass: this.config.get<string>('MAIL_PASS'),
        },
      });
    } else {
      this.logger.warn('Mail transport not configured — emails will be logged only.');
    }
  }

  async send(msg: MailMessage): Promise<void> {
    const from = this.config.get<string>('MAIL_FROM') ?? 'noreply@resourcesunlimited.ca';
    if (!this.transporter) {
      this.logger.log(`[MAIL:STUB] from=${from} to=${msg.to} subject="${msg.subject}"`);
      return;
    }
    await this.transporter.sendMail({
      from,
      to: msg.to,
      subject: msg.subject,
      text: msg.text,
      html: msg.html,
    });
  }

  get salesInbox(): string {
    return this.config.get<string>('SALES_INBOX') ?? 'sales@resourcesunlimited.ca';
  }
}
