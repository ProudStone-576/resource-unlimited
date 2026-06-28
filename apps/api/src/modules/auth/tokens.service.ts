import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';

export interface AccessTokenPayload {
  sub: string;
  role: string;
  email: string;
}

@Injectable()
export class TokensService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private sha256(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  signAccess(payload: AccessTokenPayload): string {
    const ttl = Number(this.config.get('JWT_ACCESS_TTL') ?? 900);
    return this.jwt.sign(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET') as string,
      expiresIn: ttl,
    });
  }

  verifyAccess(token: string): AccessTokenPayload {
    try {
      return this.jwt.verify<AccessTokenPayload>(token, {
        secret: this.config.get<string>('JWT_ACCESS_SECRET') as string,
      });
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }
  }

  /**
   * Issue a new refresh token. If `family` is provided, the token rotates
   * within that lineage (theft detection — see `rotate()`).
   */
  async issueRefresh(
    userId: string,
    meta: { ip?: string; userAgent?: string },
    family?: string,
  ): Promise<{ raw: string; id: string; family: string; expiresAt: Date }> {
    const raw = randomBytes(48).toString('base64url');
    const ttlSec = Number(this.config.get('JWT_REFRESH_TTL') ?? 2_592_000);
    const expiresAt = new Date(Date.now() + ttlSec * 1000);
    const lineage = family ?? randomUUID();

    const row = await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.sha256(raw),
        family: lineage,
        expiresAt,
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
      },
    });

    return { raw, id: row.id, family: row.family, expiresAt };
  }

  /**
   * Rotate a refresh token. If the incoming raw token has already been
   * revoked/replaced, the entire family is invalidated (theft detection).
   */
  async rotate(
    rawToken: string,
    meta: { ip?: string; userAgent?: string },
  ): Promise<{ userId: string; raw: string; expiresAt: Date }> {
    const existing = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.sha256(rawToken) },
    });

    if (!existing) throw new UnauthorizedException('Invalid refresh token');

    if (existing.revokedAt || existing.replacedById) {
      // Token reused after rotation → kill the whole family.
      await this.prisma.refreshToken.updateMany({
        where: { family: existing.family, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Refresh token reuse detected; session revoked');
    }

    if (existing.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const issued = await this.issueRefresh(existing.userId, meta, existing.family);
    await this.prisma.refreshToken.update({
      where: { id: existing.id },
      data: { revokedAt: new Date(), replacedById: issued.id },
    });

    return { userId: existing.userId, raw: issued.raw, expiresAt: issued.expiresAt };
  }

  async revoke(rawToken: string): Promise<void> {
    const hash = this.sha256(rawToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: hash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** Generates a one-shot token (email verify or password reset). */
  async issueOneShot(
    kind: 'verify' | 'reset',
    userId: string,
    ttlMinutes: number,
  ): Promise<string> {
    const raw = randomBytes(32).toString('base64url');
    const hash = this.sha256(raw);
    const expiresAt = new Date(Date.now() + ttlMinutes * 60_000);

    if (kind === 'verify') {
      await this.prisma.emailVerificationToken.create({
        data: { userId, tokenHash: hash, expiresAt },
      });
    } else {
      await this.prisma.passwordResetToken.create({
        data: { userId, tokenHash: hash, expiresAt },
      });
    }
    return raw;
  }

  async consumeOneShot(
    kind: 'verify' | 'reset',
    raw: string,
  ): Promise<{ userId: string } | null> {
    const hash = this.sha256(raw);
    const row =
      kind === 'verify'
        ? await this.prisma.emailVerificationToken.findUnique({ where: { tokenHash: hash } })
        : await this.prisma.passwordResetToken.findUnique({ where: { tokenHash: hash } });

    if (!row || row.usedAt || row.expiresAt.getTime() < Date.now()) return null;

    if (kind === 'verify') {
      await this.prisma.emailVerificationToken.update({
        where: { id: row.id },
        data: { usedAt: new Date() },
      });
    } else {
      await this.prisma.passwordResetToken.update({
        where: { id: row.id },
        data: { usedAt: new Date() },
      });
    }
    return { userId: row.userId };
  }
}
