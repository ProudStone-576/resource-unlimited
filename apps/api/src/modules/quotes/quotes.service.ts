import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import { MailService } from '../mail/mail.service';
import { buyerConfirmationEmail, salesNotificationEmail } from '../mail/templates';
import { RecaptchaService } from '../security/recaptcha.service';
import { QuotePdfService } from './quote-pdf.service';
import { QuotesRepository } from './quotes.repository';
import type { CreateQuoteInput } from './quotes.schema';

@Injectable()
export class QuotesService {
  private readonly logger = new Logger(QuotesService.name);

  constructor(
    private readonly repo: QuotesRepository,
    private readonly mail: MailService,
    private readonly pdf: QuotePdfService,
    private readonly recaptcha: RecaptchaService,
    private readonly config: ConfigService,
  ) {}

  private buildTrackingUrl(number: string, viewToken: string): string {
    const base = (this.config.get<string>('WEB_PUBLIC_URL') ?? 'http://localhost:3000').replace(/\/$/, '');
    return `${base}/quote/${encodeURIComponent(number)}?token=${encodeURIComponent(viewToken)}`;
  }

  async create(input: CreateQuoteInput, meta: { ip?: string; ua?: string }) {
    const verdict = await this.recaptcha.verify(input.recaptchaToken, 'quote');
    if (!verdict.ok) {
      throw new BadRequestException(`Recaptcha rejected (${verdict.reason})`);
    }

    const viewToken = randomBytes(24).toString('hex');
    const quote = await this.repo.create(input, { ...meta, viewToken });
    const trackingUrl = this.buildTrackingUrl(quote.number, viewToken);

    // PDF — fire-and-forget; URL patched on the row when ready.
    void this.pdf
      .generate({
        number: quote.number,
        status: quote.status,
        companyName: quote.companyName,
        contactName: quote.contactName,
        contactEmail: quote.contactEmail,
        contactPhone: quote.contactPhone,
        city: quote.city,
        province: quote.province,
        postalCode: quote.postalCode,
        country: quote.country,
        notes: quote.notes,
        validUntil: quote.validUntil,
        totalEstimate: quote.totalEstimate,
        currency: quote.currency,
        createdAt: quote.createdAt,
        items: quote.items,
      })
      .then(({ publicUrl }) => this.repo.setPdfUrl(quote.id, publicUrl))
      .catch((err) => this.logger.warn(`PDF generation failed for ${quote.number}: ${(err as Error).message}`));

    // Email notifications — fire-and-forget so failures don't break the API.
    const emailData = {
      number: quote.number,
      companyName: quote.companyName,
      contactName: quote.contactName,
      contactEmail: quote.contactEmail,
      contactPhone: quote.contactPhone,
      city: quote.city,
      province: quote.province,
      country: quote.country,
      notes: quote.notes,
      trackingUrl,
      items: quote.items,
    };

    const sales = salesNotificationEmail(emailData);
    const buyer = buyerConfirmationEmail(emailData);

    void this.mail
      .send({ to: this.mail.salesInbox, subject: sales.subject, text: sales.text, html: sales.html })
      .catch((err) => this.logger.warn(`Sales notify failed: ${(err as Error).message}`));

    void this.mail
      .send({ to: quote.contactEmail, subject: buyer.subject, text: buyer.text, html: buyer.html })
      .catch((err) => this.logger.warn(`Buyer confirm failed: ${(err as Error).message}`));

    return {
      id: quote.id,
      number: quote.number,
      status: quote.status,
      createdAt: quote.createdAt,
      trackingUrl,
    };
  }

  async track(number: string, viewToken: string) {
    if (!viewToken || viewToken.length < 16) {
      throw new BadRequestException('Invalid token');
    }
    const quote = await this.repo.findByNumberAndToken(number, viewToken);
    if (!quote) throw new NotFoundException('Quote not found');

    // Buyer-facing projection — strip internal-only fields.
    return {
      number: quote.number,
      status: quote.status,
      createdAt: quote.createdAt,
      updatedAt: quote.updatedAt,
      validUntil: quote.validUntil,
      totalEstimate: quote.totalEstimate?.toString() ?? null,
      currency: quote.currency,
      quotePdfUrl: quote.quotePdfUrl,
      companyName: quote.companyName,
      contactName: quote.contactName,
      contactEmail: quote.contactEmail,
      city: quote.city,
      province: quote.province,
      country: quote.country,
      notes: quote.notes,
      items: quote.items.map((it) => ({
        productSku: it.productSku,
        productName: it.productName,
        quantity: it.quantity,
        notes: it.notes,
      })),
      events: quote.events.map((e) => ({
        type: e.type,
        toStatus: e.toStatus,
        fromStatus: e.fromStatus,
        message: e.message,
        createdAt: e.createdAt,
      })),
    };
  }
}
