import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { CurrentUser, type AuthUser } from '../../auth/current-user.decorator';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../../auth/roles.guard';
import { CompanyService } from './company.service';
import {
  AcceptInviteSchema,
  InviteMemberSchema,
  UpdateMemberRoleSchema,
  type AcceptInviteInput,
  type InviteMemberInput,
  type UpdateMemberRoleInput,
} from './company.schema';

@Controller('portal/company')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CLIENT, UserRole.SALES_REP, UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class CompanyController {
  constructor(private readonly service: CompanyService) {}

  @Get()
  me(@CurrentUser() user: AuthUser) {
    return this.service.getMyCompany(user.id);
  }

  @Post('invites')
  invite(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(InviteMemberSchema)) body: InviteMemberInput,
  ) {
    return this.service.invite(user.id, body);
  }

  @Post('invites/accept')
  accept(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(AcceptInviteSchema)) body: AcceptInviteInput,
  ) {
    return this.service.acceptInvite(user.id, body.token);
  }

  @Delete('invites/:id')
  revoke(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.revokeInvite(user.id, id);
  }

  @Patch('members/:memberUserId/role')
  updateRole(
    @CurrentUser() user: AuthUser,
    @Param('memberUserId') memberUserId: string,
    @Body(new ZodValidationPipe(UpdateMemberRoleSchema)) body: UpdateMemberRoleInput,
  ) {
    return this.service.updateMemberRole(user.id, memberUserId, body);
  }

  @Delete('members/:memberUserId')
  removeMember(@CurrentUser() user: AuthUser, @Param('memberUserId') memberUserId: string) {
    return this.service.removeMember(user.id, memberUserId);
  }
}
