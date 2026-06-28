import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { NewsletterStatus } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { RecaptchaService } from '../security/recaptcha.service';
import { CrmService } from '../crm/crm.service';
import type { SubscribeInput } from './newsletter.schema';

@Injectable()
export class NewsletterService {
  private readonly logger = new Logger(NewsletterService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly recaptcha: RecaptchaService,
    private readonly crm: CrmService,
  ) {}

  async subscribe(input: SubscribeInput, meta: { ip?: string; ua?: string }) {
    const verdict = await this.recaptcha.verify(input.recaptchaToken, 'newsletter');
    if (!verdict.ok) throw new BadRequestException(`Recaptcha rejected (${verdict.reason})`);

    const email = input.email.toLowerCase();
    const token = randomBytes(24).toString('base64url');

    const sub = await this.prisma.newsletterSubscriber.upsert({
      where: { email },
      create: {
        email,
        name: input.name,
        companyName: input.companyName,
        locale: input.locale,
        source: input.source,
        unsubscribeToken: token,
        ipAddress: meta.ip,
        userAgent: meta.ua,
      },
      update: {
        status: NewsletterStatus.SUBSCRIBED,
        name: input.name ?? undefined,
        companyName: input.companyName ?? undefined,
        locale: input.locale,
        unsubscribedAt: null,
      },
    });

    // CRM sync — fire and forget; failure must not break subscription.
    void this.crm
      .upsertContact({
        email: sub.email,
        name: sub.name,
        companyName: sub.companyName,
        source: sub.source ?? 'newsletter',
      })
      .catch((err) => this.logger.warn(`CRM sync failed: ${(err as Error).message}`));

    return { id: sub.id, status: sub.status, unsubscribeToken: sub.unsubscribeToken };
  }

  async unsubscribe(token: string) {
    const sub = await this.prisma.newsletterSubscriber.findUnique({ where: { unsubscribeToken: token } });
    if (!sub) throw new BadRequestException('Invalid token');
    if (sub.status === NewsletterStatus.UNSUBSCRIBED) return { ok: true };
    await this.prisma.newsletterSubscriber.update({
      where: { id: sub.id },
      data: { status: NewsletterStatus.UNSUBSCRIBED, unsubscribedAt: new Date() },
    });
    return { ok: true };
  }

  list(filter?: { status?: NewsletterStatus; search?: string }) {
    return this.prisma.newsletterSubscriber.findMany({
      where: {
        ...(filter?.status ? { status: filter.status } : {}),
        ...(filter?.search
          ? {
              OR: [
                { email: { contains: filter.search, mode: 'insensitive' } },
                { name: { contains: filter.search, mode: 'insensitive' } },
                { companyName: { contains: filter.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
  }
}
