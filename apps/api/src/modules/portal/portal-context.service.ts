import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CompanyRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface PortalContext {
  userId: string;
  companyId: string;
  companyRole: CompanyRole;
  isApproved: boolean;
}

/**
 * Resolves the company a portal request operates on.
 *
 * Phase 4: a user belongs to one or more `UserOnCompany` rows. We pick the
 * primary (or first) membership. Multi-tenant switching (an `X-Company-Id`
 * header) can be added later without changing call sites.
 */
@Injectable()
export class PortalContextService {
  constructor(private readonly prisma: PrismaService) {}

  async resolve(userId: string, requireApproved = true): Promise<PortalContext> {
    const membership = await this.prisma.userOnCompany.findFirst({
      where: { userId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
      include: { company: true },
    });
    if (!membership) {
      throw new NotFoundException('No company membership found');
    }
    if (requireApproved && !membership.company.isApproved) {
      throw new ForbiddenException('Company account not yet approved');
    }
    return {
      userId,
      companyId: membership.companyId,
      companyRole: membership.role,
      isApproved: membership.company.isApproved,
    };
  }

  requireCompanyRole(ctx: PortalContext, ...allowed: CompanyRole[]): void {
    if (!allowed.includes(ctx.companyRole)) {
      throw new ForbiddenException('Insufficient company role');
    }
  }
}
