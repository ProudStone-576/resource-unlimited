import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, WebhookDeliveryStatus, WebhookEvent } from '@prisma/client';
import { createHmac, randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { WebhookEndpointInput } from './webhooks.schema';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.webhookEndpoint.findMany({ orderBy: { createdAt: 'desc' } });
  }

  get(id: string) {
    return this.prisma.webhookEndpoint.findUnique({ where: { id } });
  }

  create(input: WebhookEndpointInput) {
    return this.prisma.webhookEndpoint.create({ data: input });
  }

  async update(id: string, input: WebhookEndpointInput) {
    const existing = await this.prisma.webhookEndpoint.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Endpoint not found');
    return this.prisma.webhookEndpoint.update({ where: { id }, data: input });
  }

  async remove(id: string) {
    await this.prisma.webhookEndpoint.delete({ where: { id } });
    return { ok: true };
  }

  recentDeliveries(endpointId?: string) {
    return this.prisma.webhookDelivery.findMany({
      where: endpointId ? { endpointId } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { endpoint: { select: { id: true, name: true, url: true } } },
    });
  }

  /**
   * Enqueue + dispatch a webhook event to every matching endpoint.
   * Failures are recorded on the delivery row; the call returns once all
   * outbound HTTP calls settle.
   */
  async dispatch(event: WebhookEvent, payload: Record<string, unknown>): Promise<void> {
    const endpoints = await this.prisma.webhookEndpoint.findMany({
      where: { isActive: true, events: { has: event } },
    });
    if (endpoints.length === 0) return;

    await Promise.all(endpoints.map((ep) => this.deliverOne(ep, event, payload)));
  }

  private async deliverOne(
    endpoint: { id: string; url: string; secret: string },
    event: WebhookEvent,
    payload: Record<string, unknown>,
  ) {
    const delivery = await this.prisma.webhookDelivery.create({
      data: {
        endpointId: endpoint.id,
        event,
        payload: payload as Prisma.InputJsonValue,
        status: WebhookDeliveryStatus.PENDING,
      },
    });

    const requestId = randomUUID();
    const body = JSON.stringify({ id: delivery.id, event, payload, requestId });
    const signature = createHmac('sha256', endpoint.secret).update(body).digest('hex');

    try {
      const res = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-ru-event': event,
          'x-ru-signature': `sha256=${signature}`,
          'x-ru-delivery': delivery.id,
        },
        body,
        signal: AbortSignal.timeout(15_000),
      });
      const text = await res.text().catch(() => '');
      const ok = res.ok;

      await this.prisma.$transaction([
        this.prisma.webhookDelivery.update({
          where: { id: delivery.id },
          data: {
            status: ok ? WebhookDeliveryStatus.SUCCESS : WebhookDeliveryStatus.FAILED,
            attempts: { increment: 1 },
            responseCode: res.status,
            responseBody: text.slice(0, 4000),
            deliveredAt: ok ? new Date() : null,
            error: ok ? null : `HTTP ${res.status}`,
          },
        }),
        this.prisma.webhookEndpoint.update({
          where: { id: endpoint.id },
          data: {
            failures: ok ? 0 : { increment: 1 },
            lastSuccessAt: ok ? new Date() : undefined,
            lastFailureAt: ok ? undefined : new Date(),
          },
        }),
      ]);
    } catch (err) {
      const msg = (err as Error).message;
      this.logger.warn(`Webhook dispatch failed (${endpoint.id}): ${msg}`);
      await this.prisma.$transaction([
        this.prisma.webhookDelivery.update({
          where: { id: delivery.id },
          data: {
            status: WebhookDeliveryStatus.FAILED,
            attempts: { increment: 1 },
            error: msg,
          },
        }),
        this.prisma.webhookEndpoint.update({
          where: { id: endpoint.id },
          data: { failures: { increment: 1 }, lastFailureAt: new Date() },
        }),
      ]);
    }
  }
}
