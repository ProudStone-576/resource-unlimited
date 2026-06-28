import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { emailVerificationEmail, passwordResetEmail } from '../mail/auth-templates';
import { PasswordService } from './password.service';
import { TokensService } from './tokens.service';
import type {
  ConfirmPasswordResetInput,
  LoginInput,
  RegisterInput,
  RequestPasswordResetInput,
  VerifyEmailInput,
} from './auth.schema';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly maxFailed: number;
  private readonly lockoutMs: number;
  private readonly verifyTtlMin: number;
  private readonly resetTtlMin: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly password: PasswordService,
    private readonly tokens: TokensService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {
    this.maxFailed = Number(this.config.get('AUTH_MAX_FAILED_ATTEMPTS') ?? 5);
    this.lockoutMs = Number(this.config.get('AUTH_LOCKOUT_MINUTES') ?? 15) * 60_000;
    this.verifyTtlMin = Number(this.config.get('AUTH_EMAIL_VERIFY_TTL_MIN') ?? 1440);
    this.resetTtlMin = Number(this.config.get('AUTH_PASSWORD_RESET_TTL_MIN') ?? 60);
  }

  private webBase(): string {
    return (this.config.get<string>('WEB_PUBLIC_URL') ?? 'http://localhost:3000').replace(/\/$/, '');
  }

  async register(input: RegisterInput) {
    const weak = this.password.validateStrength(input.password);
    if (weak) throw new BadRequestException(weak);

    const existing = await this.prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await this.password.hash(input.password);
    const user = await this.prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        companyName: input.companyName,
        role: UserRole.CLIENT, // public signup never escalates
      },
    });

    await this.sendVerificationEmail(user.id, user.email, `${user.firstName ?? ''}`.trim() || user.email);

    return { id: user.id, email: user.email };
  }

  async sendVerificationEmail(userId: string, email: string, displayName: string): Promise<void> {
    const raw = await this.tokens.issueOneShot('verify', userId, this.verifyTtlMin);
    const url = `${this.webBase()}/verify-email?token=${encodeURIComponent(raw)}`;
    const tpl = emailVerificationEmail({ name: displayName, url });
    void this.mail
      .send({ to: email, subject: tpl.subject, text: tpl.text, html: tpl.html })
      .catch((err) => this.logger.warn(`Verify-email send failed: ${(err as Error).message}`));
  }

  async verifyEmail(input: VerifyEmailInput) {
    const result = await this.tokens.consumeOneShot('verify', input.token);
    if (!result) throw new BadRequestException('Invalid or expired verification token');
    await this.prisma.user.update({
      where: { id: result.userId },
      data: { emailVerifiedAt: new Date() },
    });
    return { ok: true };
  }

  async login(input: LoginInput, meta: { ip?: string; ua?: string }) {
    const email = input.email.toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      throw new ForbiddenException('Account locked. Try again later.');
    }
    if (!user.isActive) throw new ForbiddenException('Account is inactive');

    const valid = await this.password.verify(user.passwordHash, input.password);
    if (!valid) {
      const attempts = user.failedLoginAttempts + 1;
      const shouldLock = attempts >= this.maxFailed;
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: attempts,
          lockedUntil: shouldLock ? new Date(Date.now() + this.lockoutMs) : null,
        },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    // Successful auth → reset counters, mark login.
    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
    });

    const access = this.tokens.signAccess({ sub: user.id, role: user.role, email: user.email });
    const refresh = await this.tokens.issueRefresh(user.id, { ip: meta.ip, userAgent: meta.ua });

    return {
      access,
      refresh: refresh.raw,
      refreshExpiresAt: refresh.expiresAt,
      user: this.publicUser(user),
    };
  }

  async refresh(rawRefresh: string, meta: { ip?: string; ua?: string }) {
    const rotated = await this.tokens.rotate(rawRefresh, { ip: meta.ip, userAgent: meta.ua });
    const user = await this.prisma.user.findUnique({ where: { id: rotated.userId } });
    if (!user || !user.isActive) throw new UnauthorizedException('User not found or inactive');

    const access = this.tokens.signAccess({ sub: user.id, role: user.role, email: user.email });
    return {
      access,
      refresh: rotated.raw,
      refreshExpiresAt: rotated.expiresAt,
      user: this.publicUser(user),
    };
  }

  async logout(rawRefresh?: string) {
    if (rawRefresh) await this.tokens.revoke(rawRefresh);
    return { ok: true };
  }

  async logoutAll(userId: string) {
    await this.tokens.revokeAllForUser(userId);
    return { ok: true };
  }

  async requestPasswordReset(input: RequestPasswordResetInput) {
    const user = await this.prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
    // Don't leak whether the email exists.
    if (user && user.isActive) {
      const raw = await this.tokens.issueOneShot('reset', user.id, this.resetTtlMin);
      const url = `${this.webBase()}/reset-password?token=${encodeURIComponent(raw)}`;
      const tpl = passwordResetEmail({
        name: `${user.firstName ?? ''}`.trim() || user.email,
        url,
        ttlMinutes: this.resetTtlMin,
      });
      void this.mail
        .send({ to: user.email, subject: tpl.subject, text: tpl.text, html: tpl.html })
        .catch((err) => this.logger.warn(`Password-reset send failed: ${(err as Error).message}`));
    }
    return { ok: true };
  }

  async confirmPasswordReset(input: ConfirmPasswordResetInput) {
    const result = await this.tokens.consumeOneShot('reset', input.token);
    if (!result) throw new BadRequestException('Invalid or expired reset token');

    const weak = this.password.validateStrength(input.password);
    if (weak) throw new BadRequestException(weak);

    const hash = await this.password.hash(input.password);
    await this.prisma.user.update({
      where: { id: result.userId },
      data: {
        passwordHash: hash,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
    await this.tokens.revokeAllForUser(result.userId);
    return { ok: true };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    return this.publicUser(user);
  }

  private publicUser(user: {
    id: string;
    email: string;
    role: string;
    firstName: string | null;
    lastName: string | null;
    companyName: string | null;
    emailVerifiedAt: Date | null;
  }) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      companyName: user.companyName,
      emailVerified: Boolean(user.emailVerifiedAt),
    };
  }
}
