import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';

/**
 * Phase 2 interim guard.
 *
 * Admin endpoints are gated by a shared X-Admin-Token header until Phase 3
 * lands JWT + RBAC. The token comes from env (ADMIN_API_TOKEN). If the env
 * value is missing in non-production, the guard fails closed so we never
 * accidentally expose admin routes.
 */
@Injectable()
export class AdminTokenGuard implements CanActivate {
  private readonly logger = new Logger(AdminTokenGuard.name);

  constructor(private readonly config: ConfigService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<Request>();
    const expected = this.config.get<string>('ADMIN_API_TOKEN');
    if (!expected) {
      this.logger.warn('ADMIN_API_TOKEN not configured — admin routes blocked.');
      throw new UnauthorizedException('Admin token not configured');
    }
    const provided = (req.headers['x-admin-token'] as string | undefined) ?? '';
    if (!provided) throw new UnauthorizedException('Missing X-Admin-Token');

    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedException('Invalid admin token');
    }
    return true;
  }
}
