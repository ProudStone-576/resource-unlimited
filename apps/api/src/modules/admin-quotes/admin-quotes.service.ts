import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';
import { statusChangedEmail } from '../mail/templates';
import { QuotePdfService } from '../quotes/quote-pdf.service';
import { AdminQuotesRepository } from './admin-quotes.repository';
import type { ListAdminQuotesQueryDto } from './admin-quotes.dto';
import type { UpdateQuoteStatusInput } from './admin-quotes.schema';

@Injectable()
export class AdminQuotesService {
  private readonly logger = new Logger(AdminQuotesService.name);

  constructor(
    private readonly repo: AdminQuotesRepository,
    private readonly pdf: QuotePdfService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  private trackingUrl(number: string, viewToken: string): string {
    const base = (this.config.get<string>('WEB_PUBLIC_URL') ?? 'http://localhost:3000').replace(/\/$/, '');
    return `${base}/quote/${encodeURIComponent(number)}?token=${encodeURIComponent(viewToken)}`;
  }

  async list(q: ListAdminQuotesQueryDto) {
    const { total, data } = await this.repo.list(q);
    return {
      data,
      meta: {
        page: q.page,
        pageSize: q.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / q.pageSize)),
      },
    };
  }

  async get(id: string) {
    const quote = await this.repo.getById(id);
    if (!quote) throw new NotFoundException('Quote not found');
    return quote;
  }

  async updateStatus(id: string, input: UpdateQuoteStatusInput, actorLabel: string) {
    const updated = await this.repo.updateStatus(id, input, actorLabel);
    if (!updated) throw new NotFoundException('Quote not found');

    if (input.notifyBuyer) {
      const tpl = statusChangedEmail({
        number: updated.number,
        contactName: updated.contactName,
        status: updated.status,
        trackingUrl: this.trackingUrl(updated.number, updated.viewToken),
      });
      void this.mail
        .send({ to: updated.contactEmail, subject: tpl.subject, text: tpl.text, html: tpl.html })
        .catch((err) => this.logger.warn(`Status-change email failed: ${(err as Error).message}`));
    }

    return updated;
  }

  async assign(id: string, salesRepId: string | null, actorLabel: string) {
    return this.repo.assign(id, salesRepId, actorLabel);
  }

  async regeneratePdf(id: string, actorLabel: string) {
    const quote = await this.repo.getById(id);
    if (!quote) throw new NotFoundException('Quote not found');
    const { publicUrl } = await this.pdf.generate({
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
    });
    await this.repo.setPdfUrl(id, publicUrl, actorLabel);
    return { pdfUrl: publicUrl };
  }
}
