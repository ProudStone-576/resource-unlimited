import { z } from 'zod';
import { CompanyRole } from '@prisma/client';

export const InviteMemberSchema = z.object({
  email: z.string().email().max(200),
  role: z.nativeEnum(CompanyRole).default(CompanyRole.MEMBER),
});
export type InviteMemberInput = z.infer<typeof InviteMemberSchema>;

export const UpdateMemberRoleSchema = z.object({
  role: z.nativeEnum(CompanyRole),
});
export type UpdateMemberRoleInput = z.infer<typeof UpdateMemberRoleSchema>;

export const AcceptInviteSchema = z.object({
  token: z.string().min(16).max(512),
});
export type AcceptInviteInput = z.infer<typeof AcceptInviteSchema>;
