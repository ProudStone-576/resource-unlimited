import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AddressType,
  InvoiceStatus,
  OrderEventType,
  OrderStatus,
  Prisma,
  QuoteEventType,
  QuoteStatus,
  WebhookEvent,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import { WebhooksService } from '../../webhooks/webhooks.service';
import { PortalContextService } from '../portal-context.service';
import { PricingService } from '../pricing.service';
import { PromotionsEngineService } from '../promotions-engine.service';
import { InvoicePdfService } from './invoice-pdf.service';
import type { CreateOrderInput } from './orders.schema';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: PortalContextService,
    private readonly pricing: PricingService,
    private readonly promotions: PromotionsEngineService,
    private readonly mail: MailService,
    private readonly invoicePdf: InvoicePdfService,
    private readonly webhooks: WebhooksService,
    private readonly config: ConfigService,
  ) {}

  async list(userId: string) {
    const ctx = await this.ctx.resolve(userId);
    return this.prisma.order.findMany({
      where: { companyId: ctx.companyId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { items: true } },
        invoices: { select: { id: true, number: true, status: true, pdfUrl: true } },
      },
    });
  }

  async get(userId: string, id: string) {
    const ctx = await this.ctx.resolve(userId);
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        events: { orderBy: { createdAt: 'asc' } },
        invoices: true,
        shippingAddress: true,
        billingAddress: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.companyId !== ctx.companyId) throw new ForbiddenException('Wrong company');
    return order;
  }

  async create(userId: string, input: CreateOrderInput) {
    const ctx = await this.ctx.resolve(userId);

    const [shipping, billing, user] = await this.prisma.$transaction([
      this.prisma.address.findUnique({ where: { id: input.shippingAddressId } }),
      input.billingAddressId
        ? this.prisma.address.findUnique({ where: { id: input.billingAddressId } })
        : this.prisma.address.findFirst({
            where: { companyId: ctx.companyId, type: { in: [AddressType.BILLING, AddressType.BOTH] }, isDefault: true },
          }),
      this.prisma.user.findUnique({ where: { id: userId } }),
    ]);

    if (!shipping || shipping.companyId !== ctx.companyId) {
      throw new BadRequestException('Invalid shipping address');
    }
    if (billing && billing.companyId !== ctx.companyId) {
      throw new BadRequestException('Invalid billing address');
    }
    if (!user) throw new ForbiddenException('User missing');

    const productIds = input.items.map((it) => it.productId);
    const prices = await this.pricing.resolveForCompany(ctx.companyId, productIds);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, sku: true, name: true, status: true },
    });
    const productById = new Map(products.map((p) => [p.id, p]));

    let subtotal = new Prisma.Decimal(0);
    const itemRows = input.items.map((it) => {
      const product = productById.get(it.productId);
      if (!product || product.status !== 'ACTIVE') {
        throw new BadRequestException(`Product not available: ${it.productId}`);
      }
      const price = prices.get(it.productId);
      if (!price || price.source === 'NONE') {
        throw new BadRequestException(`No price available for ${product.sku}; please request a quote instead`);
      }
      const qty = it.quantity;
      const lineTotal = new Prisma.Decimal(price.unitPrice).mul(qty);
      subtotal = subtotal.add(lineTotal);
      return {
        productId: it.productId,
        productSku: product.sku,
        productName: product.name,
        quantity: qty,
        unitPrice: price.unitPrice,
        lineTotal,
        notes: it.notes,
      };
    });

    if (input.sourceQuoteId) {
      const quote = await this.prisma.quoteRequest.findUnique({ where: { id: input.sourceQuoteId } });
      if (!quote || quote.status !== QuoteStatus.QUOTED) {
        throw new BadRequestException('Source quote not eligible for conversion');
      }
    }

    // Phase 6 — apply best-fit promotion (if any). Discount reduces grandTotal
    // but leaves subtotal intact for accounting clarity.
    const applied = await this.promotions
      .resolveForCart({ companyId: ctx.companyId, subtotal, currency: 'CAD' })
      .catch(() => null);
    const discountAmount = applied ? new Prisma.Decimal(applied.discountAmount) : new Prisma.Decimal(0);
    const grandTotal = subtotal.minus(discountAmount);
    const orderNotes = applied
      ? `${input.notes ? input.notes + '\n\n' : ''}Promotion applied: ${applied.promotionName} (-${applied.discountAmount} CAD)`
      : input.notes;

    const year = new Date().getFullYear();
    const count = await this.prisma.order.count({
      where: { createdAt: { gte: new Date(`${year}-01-01T00:00:00Z`) } },
    });
    const number = `O-${year}-${String(count + 1).padStart(6, '0')}`;

    const shippingSnap = this.addressSnapshot(shipping);
    const billingSnap = billing ? this.addressSnapshot(billing) : null;

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          number,
          companyId: ctx.companyId,
          placedByUserId: userId,
          buyerName: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email,
          buyerEmail: user.email,
          shippingAddressId: shipping.id,
          shippingSnapshot: shippingSnap as unknown as Prisma.InputJsonValue,
          billingAddressId: billing?.id ?? null,
          billingSnapshot: billingSnap as unknown as Prisma.InputJsonValue,
          notes: orderNotes,
          currency: 'CAD',
          subtotal,
          taxTotal: new Prisma.Decimal(0),
          shippingTotal: new Prisma.Decimal(0),
          grandTotal,
          sourceQuoteId: input.sourceQuoteId,
          items: { create: itemRows },
          events: {
            create: [
              {
                type: OrderEventType.CREATED,
                toStatus: OrderStatus.PENDING,
                actorUserId: userId,
                actorLabel: user.email,
              },
            ],
          },
        },
        include: { items: true },
      });

      if (input.sourceQuoteId) {
        await tx.quoteEvent.create({
          data: {
            quoteId: input.sourceQuoteId,
            type: QuoteEventType.CONVERTED_TO_ORDER,
            message: created.number,
            actorUserId: userId,
            actorLabel: user.email,
          },
        });
      }
      return created;
    });

    void this.notifyOrderPlaced(order.id).catch((err) =>
      this.logger.warn(`Order notify failed: ${(err as Error).message}`),
    );

    void this.webhooks
      .dispatch(WebhookEvent.ORDER_CREATED, {
        orderId: order.id,
        number: order.number,
        companyId: ctx.companyId,
        status: order.status,
        currency: order.currency,
        subtotal: order.subtotal.toString(),
        grandTotal: order.grandTotal.toString(),
        items: order.items.map((it) => ({
          sku: it.productSku,
          name: it.productName,
          quantity: it.quantity,
          unitPrice: it.unitPrice.toString(),
        })),
      })
      .catch((err) => this.logger.warn(`Order webhook dispatch failed: ${(err as Error).message}`));

    return order;
  }

  async reorder(userId: string, sourceOrderId: string, shippingAddressId: string) {
    const ctx = await this.ctx.resolve(userId);
    const source = await this.prisma.order.findUnique({
      where: { id: sourceOrderId },
      include: { items: true },
    });
    if (!source) throw new NotFoundException('Source order not found');
    if (source.companyId !== ctx.companyId) throw new ForbiddenException('Wrong company');

    return this.create(userId, {
      shippingAddressId,
      items: source.items
        .filter((it) => it.productId)
        .map((it) => ({
          productId: it.productId as string,
          quantity: it.quantity,
          ...(it.notes ? { notes: it.notes } : {}),
        })),
    });
  }

  async updateStatus(
    userId: string,
    actorRole: 'staff' | 'self',
    id: string,
    next: OrderStatus,
    message: string | undefined,
  ) {
    if (actorRole === 'self' && next !== OrderStatus.CANCELLED) {
      throw new ForbiddenException('Clients can only cancel their own orders');
    }
    const ctx = await this.ctx.resolve(userId, false);
    const existing = await this.prisma.order.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Order not found');
    if (actorRole === 'self' && existing.companyId !== ctx.companyId) {
      throw new ForbiddenException('Wrong company');
    }
    if (actorRole === 'self' && existing.status !== OrderStatus.PENDING) {
      throw new ForbiddenException('Only PENDING orders can be self-cancelled');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const u = await tx.order.update({ where: { id }, data: { status: next } });
      await tx.orderEvent.create({
        data: {
          orderId: id,
          type: OrderEventType.STATUS_CHANGED,
          fromStatus: existing.status as OrderStatus,
          toStatus: next,
          actorUserId: userId,
          message,
        },
      });
      return u;
    });

    if (next === OrderStatus.SHIPPED) {
      await this.generateInvoice(id).catch((err) =>
        this.logger.warn(`Invoice generation failed: ${(err as Error).message}`),
      );
    }

    void this.webhooks
      .dispatch(WebhookEvent.ORDER_STATUS_CHANGED, {
        orderId: id,
        number: existing.number,
        from: existing.status,
        to: next,
      })
      .catch(() => undefined);
    return updated;
  }

  async generateInvoice(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, company: true, billingAddress: true, shippingAddress: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    const existing = await this.prisma.invoice.findFirst({ where: { orderId } });
    if (existing) return existing;

    const year = new Date().getFullYear();
    const count = await this.prisma.invoice.count({
      where: { createdAt: { gte: new Date(`${year}-01-01T00:00:00Z`) } },
    });
    const number = `INV-${year}-${String(count + 1).padStart(6, '0')}`;

    const issued = new Date();
    const due = new Date(issued.getTime() + 30 * 24 * 60 * 60_000);

    const billingAddr = order.billingAddress ?? order.shippingAddress;
    const billingSnap = billingAddr ? this.addressSnapshot(billingAddr) : null;

    const invoice = await this.prisma.invoice.create({
      data: {
        number,
        status: InvoiceStatus.ISSUED,
        companyId: order.companyId,
        orderId: order.id,
        currency: order.currency,
        subtotal: order.subtotal,
        taxTotal: order.taxTotal,
        grandTotal: order.grandTotal,
        issuedAt: issued,
        dueAt: due,
        billingSnapshot: (billingSnap ?? null) as Prisma.InputJsonValue,
      },
    });

    const billing = {
      companyName: order.company.name,
      line1: billingAddr?.line1 ?? '',
      ...(billingAddr?.line2 ? { line2: billingAddr.line2 } : {}),
      city: billingAddr?.city ?? '',
      province: billingAddr?.province ?? '',
      postalCode: billingAddr?.postalCode ?? '',
      country: billingAddr?.country ?? 'CA',
    };

    const { publicUrl } = await this.invoicePdf.generate({
      number: invoice.number,
      status: invoice.status,
      issuedAt: invoice.issuedAt,
      dueAt: invoice.dueAt,
      currency: invoice.currency,
      subtotal: invoice.subtotal,
      taxTotal: invoice.taxTotal,
      grandTotal: invoice.grandTotal,
      billing,
      items: order.items.map((it) => ({
        productSku: it.productSku,
        productName: it.productName,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        lineTotal: it.lineTotal,
      })),
    });

    await this.prisma.$transaction([
      this.prisma.invoice.update({ where: { id: invoice.id }, data: { pdfUrl: publicUrl } }),
      this.prisma.orderEvent.create({
        data: {
          orderId: order.id,
          type: OrderEventType.INVOICE_GENERATED,
          message: publicUrl,
          actorLabel: 'system',
        },
      }),
    ]);

    void this.webhooks
      .dispatch(WebhookEvent.INVOICE_ISSUED, {
        invoiceId: invoice.id,
        number: invoice.number,
        orderId: order.id,
        orderNumber: order.number,
        grandTotal: invoice.grandTotal.toString(),
        currency: invoice.currency,
        pdfUrl: publicUrl,
      })
      .catch(() => undefined);

    return { ...invoice, pdfUrl: publicUrl };
  }

  async listInvoices(userId: string) {
    const ctx = await this.ctx.resolve(userId);
    return this.prisma.invoice.findMany({
      where: { companyId: ctx.companyId },
      orderBy: [{ issuedAt: 'desc' }, { createdAt: 'desc' }],
      include: { order: { select: { id: true, number: true } } },
    });
  }

  async getInvoice(userId: string, id: string) {
    const ctx = await this.ctx.resolve(userId);
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: { order: true },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.companyId !== ctx.companyId) throw new ForbiddenException('Wrong company');
    return invoice;
  }

  private addressSnapshot(a: {
    id: string;
    type: AddressType;
    label: string | null;
    attentionTo: string | null;
    line1: string;
    line2: string | null;
    city: string;
    province: string;
    postalCode: string;
    country: string;
    phone: string | null;
  }) {
    return {
      id: a.id,
      type: a.type,
      label: a.label,
      attentionTo: a.attentionTo,
      line1: a.line1,
      line2: a.line2,
      city: a.city,
      province: a.province,
      postalCode: a.postalCode,
      country: a.country,
      phone: a.phone,
    };
  }

  private async notifyOrderPlaced(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, company: true },
    });
    if (!order) return;
    const lines = order.items
      .map((it) => `- ${it.productSku} | ${it.productName} | qty ${it.quantity} @ ${it.unitPrice.toString()}`)
      .join('\n');

    void this.mail
      .send({
        to: this.mail.salesInbox,
        subject: `New order ${order.number} — ${order.company.name}`,
        text:
          `Order: ${order.number}\n` +
          `Company: ${order.company.name}\n` +
          `Buyer: ${order.buyerName} <${order.buyerEmail}>\n` +
          `Total: ${order.currency} ${order.grandTotal.toString()}\n\n` +
          `Items:\n${lines}\n`,
      })
      .catch(() => undefined);

    void this.mail
      .send({
        to: order.buyerEmail,
        subject: `We received your order — ${order.number}`,
        text:
          `Hi ${order.buyerName},\n\n` +
          `Thanks for your order. Reference: ${order.number}.\n` +
          `Total: ${order.currency} ${order.grandTotal.toString()}\n\n` +
          `We'll update you when it ships.\n\n` +
          `— Resources Unlimited`,
      })
      .catch(() => undefined);
  }
}
