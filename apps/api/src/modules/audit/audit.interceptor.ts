import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import type { Request } from 'express';
import { AuditService } from './audit.service';
import { AUDIT_METADATA, type AuditOptions } from './audit.decorator';

interface AuthedRequest extends Request {
  user?: { id: string; email: string };
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly audit: AuditService,
  ) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const opts = this.reflector.get<AuditOptions | undefined>(AUDIT_METADATA, ctx.getHandler());
    if (!opts) return next.handle();

    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const reqAny = req as AuthedRequest & { body?: Record<string, unknown> };
    const before = { params: req.params, body: reqAny.body };
    const requestId = (req.headers['x-request-id'] as string | undefined) ?? undefined;
    const ip = req.ip;
    const ua = req.headers['user-agent'] as string | undefined;

    return next.handle().pipe(
      tap((result: unknown) => {
        const idFrom = opts.idFrom ?? 'id';
        const fromResult =
          result && typeof result === 'object'
            ? (result as Record<string, unknown>)[idFrom]
            : undefined;
        const paramId =
          req.params && typeof (req.params as Record<string, unknown>).id === 'string'
            ? ((req.params as Record<string, string>).id)
            : undefined;
        const entityId: string | null =
          (typeof fromResult === 'string' ? fromResult : undefined) ?? paramId ?? null;
        void this.audit.log({
          actorUserId: req.user?.id ?? null,
          actorLabel: req.user?.email ?? null,
          action: opts.action,
          entityType: opts.entityType,
          entityId,
          before,
          after: result ?? null,
          requestId,
          ipAddress: ip,
          userAgent: ua,
        });
      }),
    );
  }
}
