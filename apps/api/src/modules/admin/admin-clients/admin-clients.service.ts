import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CompanyApplicationStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  ApproveCompanyInput,
  ListCompaniesQuery,
  RejectCompanyInput,
  SetCompanyPriceListInput,
} from './admin-clients.schema';

@Injectable()
export class AdminClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async listCompanies(q: ListCompaniesQuery) {
    const where: Prisma.CompanyWhereInput = {};
    if (q.approved === 'true') where.isApproved = true;
    if (q.approved === 'false') where.isApproved = false;
    if (q.search) {
      where.OR = [
        { name: { contains: q.search, mode: 'insensitive' } },
        { slug: { contains: q.search, mode: 'insensitive' } },
        { legalName: { contains: q.search, mode: 'insensitive' } },
      ];
    }
    const skip = (q.page - 1) * q.pageSize;
    const [total, data] = await this.prisma.$transaction([
      this.prisma.company.count({ where }),
      this.prisma.company.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: q.pageSize,
        include: {
          _count: { select: { members: true, orders: true } },
          priceList: { select: { id: true, name: true } },
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

  async getCompany(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        members: {
          include: { user: { select: { id: true, email: true, firstName: true, lastName: true, role: true } } },
        },
        priceList: true,
        applications: { orderBy: { createdAt: 'desc' } },
        addresses: true,
      },
    });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async approve(companyId: string, actorUserId: string, input: ApproveCompanyInput) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Company not found');

    const now = new Date();
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.company.update({
        where: { id: companyId },
        data: { isApproved: true, approvedAt: now },
      });
      await tx.companyApplication.create({
        data: {
          companyId,
          status: CompanyApplicationStatus.APPROVED,
          reviewedById: actorUserId,
          reviewedAt: now,
          notes: input.notes,
        },
      });
      return updated;
    });
  }

  async reject(companyId: string, actorUserId: string, input: RejectCompanyInput) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Company not found');
    const now = new Date();
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.company.update({
        where: { id: companyId },
        data: { isApproved: false, approvedAt: null },
      });
      await tx.companyApplication.create({
        data: {
          companyId,
          status: CompanyApplicationStatus.REJECTED,
          reviewedById: actorUserId,
          reviewedAt: now,
          rejectionReason: input.reason,
        },
      });
      return updated;
    });
  }

  async setPriceList(companyId: string, input: SetCompanyPriceListInput) {
    if (input.priceListId) {
      const exists = await this.prisma.priceList.findUnique({
        where: { id: input.priceListId },
        select: { id: true },
      });
      if (!exists) throw new BadRequestException('PriceList not found');
    }
    return this.prisma.company.update({
      where: { id: companyId },
      data: { priceListId: input.priceListId },
    });
  }
}
