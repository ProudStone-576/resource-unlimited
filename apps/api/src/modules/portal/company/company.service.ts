import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'node:crypto';
import { CompanyInviteStatus, CompanyRole } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import { PortalContextService } from '../portal-context.service';
import type { InviteMemberInput, UpdateMemberRoleInput } from './company.schema';

const INVITE_TTL_DAYS = 14;

@Injectable()
export class CompanyService {
  private readonly logger = new Logger(CompanyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly ctx: PortalContextService,
    private readonly config: ConfigService,
  ) {}

  private webBase() {
    return (this.config.get<string>('WEB_PUBLIC_URL') ?? 'http://localhost:3000').replace(/\/$/, '');
  }

  private sha256(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }

  async getMyCompany(userId: string) {
    const ctx = await this.ctx.resolve(userId, false);
    const company = await this.prisma.company.findUnique({
      where: { id: ctx.companyId },
      include: {
        members: { include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } } },
        invites: { where: { status: CompanyInviteStatus.PENDING } },
      },
    });
    return { company, role: ctx.companyRole };
  }

  async invite(userId: string, input: InviteMemberInput) {
    const ctx = await this.ctx.resolve(userId);
    this.ctx.requireCompanyRole(ctx, CompanyRole.ADMIN, CompanyRole.OWNER);

    const existingMember = await this.prisma.userOnCompany.findFirst({
      where: { companyId: ctx.companyId, user: { email: input.email.toLowerCase() } },
    });
    if (existingMember) throw new ConflictException('User already a member of this company');

    const pending = await this.prisma.companyInvite.findFirst({
      where: { companyId: ctx.companyId, email: input.email.toLowerCase(), status: CompanyInviteStatus.PENDING },
    });
    if (pending) throw new ConflictException('Invite already pending for this email');

    if (input.role === CompanyRole.OWNER) {
      this.ctx.requireCompanyRole(ctx, CompanyRole.OWNER);
    }

    const raw = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 3600_000);
    const invite = await this.prisma.companyInvite.create({
      data: {
        companyId: ctx.companyId,
        email: input.email.toLowerCase(),
        role: input.role,
        tokenHash: this.sha256(raw),
        expiresAt,
        invitedById: userId,
      },
      include: { company: true },
    });

    const acceptUrl = `${this.webBase()}/portal/company/invites/accept?token=${encodeURIComponent(raw)}`;
    void this.mail
      .send({
        to: invite.email,
        subject: `Join ${invite.company.name} on Resources Unlimited`,
        text:
          `You've been invited to join ${invite.company.name} on Resources Unlimited.\n\n` +
          `Accept the invite (valid ${INVITE_TTL_DAYS} days):\n${acceptUrl}\n`,
      })
      .catch((err) => this.logger.warn(`Invite email failed: ${(err as Error).message}`));

    return { id: invite.id, email: invite.email, role: invite.role, expiresAt };
  }

  async acceptInvite(userId: string, rawToken: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const invite = await this.prisma.companyInvite.findUnique({ where: { tokenHash: this.sha256(rawToken) } });
    if (!invite || invite.status !== CompanyInviteStatus.PENDING) {
      throw new BadRequestException('Invalid or expired invite');
    }
    if (invite.expiresAt.getTime() < Date.now()) {
      await this.prisma.companyInvite.update({
        where: { id: invite.id },
        data: { status: CompanyInviteStatus.EXPIRED },
      });
      throw new BadRequestException('Invite expired');
    }
    if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
      throw new ForbiddenException('Invite is for a different email');
    }

    const existing = await this.prisma.userOnCompany.findUnique({
      where: { userId_companyId: { userId, companyId: invite.companyId } },
    });
    if (existing) throw new ConflictException('Already a member');

    await this.prisma.$transaction([
      this.prisma.userOnCompany.create({
        data: { userId, companyId: invite.companyId, role: invite.role },
      }),
      this.prisma.companyInvite.update({
        where: { id: invite.id },
        data: { status: CompanyInviteStatus.ACCEPTED, acceptedAt: new Date() },
      }),
    ]);
    return { ok: true, companyId: invite.companyId };
  }

  async updateMemberRole(actorId: string, memberUserId: string, input: UpdateMemberRoleInput) {
    const ctx = await this.ctx.resolve(actorId);
    this.ctx.requireCompanyRole(ctx, CompanyRole.OWNER);

    if (memberUserId === actorId) throw new BadRequestException("Can't change your own role");

    const member = await this.prisma.userOnCompany.findUnique({
      where: { userId_companyId: { userId: memberUserId, companyId: ctx.companyId } },
    });
    if (!member) throw new NotFoundException('Member not found');

    return this.prisma.userOnCompany.update({
      where: { userId_companyId: { userId: memberUserId, companyId: ctx.companyId } },
      data: { role: input.role },
    });
  }

  async removeMember(actorId: string, memberUserId: string) {
    const ctx = await this.ctx.resolve(actorId);
    this.ctx.requireCompanyRole(ctx, CompanyRole.ADMIN, CompanyRole.OWNER);

    if (memberUserId === actorId) throw new BadRequestException("Can't remove yourself");

    const member = await this.prisma.userOnCompany.findUnique({
      where: { userId_companyId: { userId: memberUserId, companyId: ctx.companyId } },
    });
    if (!member) throw new NotFoundException('Member not found');
    if (member.role === CompanyRole.OWNER) {
      this.ctx.requireCompanyRole(ctx, CompanyRole.OWNER);
    }

    await this.prisma.userOnCompany.delete({
      where: { userId_companyId: { userId: memberUserId, companyId: ctx.companyId } },
    });
    return { ok: true };
  }

  async revokeInvite(actorId: string, inviteId: string) {
    const ctx = await this.ctx.resolve(actorId);
    this.ctx.requireCompanyRole(ctx, CompanyRole.ADMIN, CompanyRole.OWNER);

    const invite = await this.prisma.companyInvite.findUnique({ where: { id: inviteId } });
    if (!invite || invite.companyId !== ctx.companyId) throw new NotFoundException('Invite not found');
    if (invite.status !== CompanyInviteStatus.PENDING) {
      throw new BadRequestException(`Invite already ${invite.status.toLowerCase()}`);
    }
    await this.prisma.companyInvite.update({
      where: { id: inviteId },
      data: { status: CompanyInviteStatus.REVOKED },
    });
    return { ok: true };
  }
}
