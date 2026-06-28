import { SetMetadata } from '@nestjs/common';
import { AuditAction } from '@prisma/client';

export const AUDIT_METADATA = 'ru:audit';

export interface AuditOptions {
  entityType: string;
  action: AuditAction;
  /** Where to find the entity id in the response payload (default: 'id'). */
  idFrom?: string;
}

export const Audit = (opts: AuditOptions) => SetMetadata(AUDIT_METADATA, opts);
