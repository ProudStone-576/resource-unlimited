import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PortalContextService } from '../portal-context.service';
import type { AddressInput } from './addresses.schema';

@Injectable()
export class AddressesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: PortalContextService,
  ) {}

  async list(userId: string) {
    const ctx = await this.ctx.resolve(userId);
    return this.prisma.address.findMany({
      where: { companyId: ctx.companyId },
      orderBy: [{ isDefault: 'desc' }, { type: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async create(userId: string, input: AddressInput) {
    const ctx = await this.ctx.resolve(userId);
    if (input.isDefault) {
      await this.prisma.address.updateMany({
        where: { companyId: ctx.companyId, type: input.type },
        data: { isDefault: false },
      });
    }
    return this.prisma.address.create({
      data: { ...input, companyId: ctx.companyId },
    });
  }

  async update(userId: string, id: string, input: AddressInput) {
    const ctx = await this.ctx.resolve(userId);
    const existing = await this.prisma.address.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Address not found');
    if (existing.companyId !== ctx.companyId) throw new ForbiddenException('Wrong company');

    if (input.isDefault) {
      await this.prisma.address.updateMany({
        where: { companyId: ctx.companyId, type: input.type, NOT: { id } },
        data: { isDefault: false },
      });
    }
    return this.prisma.address.update({ where: { id }, data: input });
  }

  async remove(userId: string, id: string) {
    const ctx = await this.ctx.resolve(userId);
    const existing = await this.prisma.address.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Address not found');
    if (existing.companyId !== ctx.companyId) throw new ForbiddenException('Wrong company');
    await this.prisma.address.delete({ where: { id } });
    return { ok: true };
  }
}
