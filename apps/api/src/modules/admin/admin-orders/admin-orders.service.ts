import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderEventType, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { OrdersService } from '../../portal/orders/orders.service';
import type { ListOrdersQuery, UpdateOrderStatusInput } from './admin-orders.schema';

@Injectable()
export class AdminOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly portal: OrdersService,
  ) {}

  async list(q: ListOrdersQuery) {
    const where: Prisma.OrderWhereInput = {};
    if (q.status) where.status = q.status;
    if (q.companyId) where.companyId = q.companyId;
    if (q.search) {
      where.OR = [
        { number: { contains: q.search, mode: 'insensitive' } },
        { buyerEmail: { contains: q.search, mode: 'insensitive' } },
        { company: { name: { contains: q.search, mode: 'insensitive' } } },
      ];
    }
    const skip = (q.page - 1) * q.pageSize;
    const [total, data] = await this.prisma.$transaction([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: q.pageSize,
        include: {
          company: { select: { id: true, name: true } },
          _count: { select: { items: true } },
        },
      }),
    ]);
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
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        events: { orderBy: { createdAt: 'asc' } },
        invoices: true,
        company: { select: { id: true, name: true } },
        shippingAddress: true,
        billingAddress: true,
        placedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async updateStatus(id: string, input: UpdateOrderStatusInput, actor: string) {
    const existing = await this.prisma.order.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Order not found');

    const updated = await this.prisma.$transaction(async (tx) => {
      const o = await tx.order.update({ where: { id }, data: { status: input.status } });
      await tx.orderEvent.create({
        data: {
          orderId: id,
          type: OrderEventType.STATUS_CHANGED,
          fromStatus: existing.status,
          toStatus: input.status,
          actorLabel: actor,
          message: input.message,
        },
      });
      return o;
    });

    if (input.status === 'SHIPPED') {
      await this.portal.generateInvoice(id).catch(() => undefined);
    }
    return updated;
  }
}
