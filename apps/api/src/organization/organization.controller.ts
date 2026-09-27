import { Body, Controller, Get, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import type { JwtPayload } from "../auth/auth.types.js";
import { CurrentUser } from "../common/current-user.decorator.js";
import { ZodValidationPipe } from "../common/zod-validation.pipe.js";
import { OrganizationInviteService } from "./organization-invite.service.js";
import { OrganizationService } from "./organization.service.js";
import {
  CreateInviteSchema,
  UpdateOrganizationSettingsSchema,
  type CreateInviteBody,
  type UpdateOrganizationSettingsBody,
} from "./organization.schemas.js";

@Controller("organization")
@UseGuards(JwtAuthGuard)
export class OrganizationController {
  constructor(
    private readonly organization: OrganizationService,
    private readonly invites: OrganizationInviteService,
  ) {}

  @Get("settings")
  getSettings(@CurrentUser() user: JwtPayload) {
    return this.organization.getSettings(user.orgId);
  }

  @Patch("settings")
  updateSettings(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(UpdateOrganizationSettingsSchema))
    body: UpdateOrganizationSettingsBody,
  ) {
    return this.organization.updateSettings(user.orgId, body);
  }

  @Get("invites")
  listInvites(@CurrentUser() user: JwtPayload) {
    return this.invites.list(user.orgId, user.sub);
  }

  @Post("invites")
  createInvite(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(CreateInviteSchema)) body: CreateInviteBody,
  ) {
    return this.invites.create(user.orgId, user.sub, body.email, body.role);
  }
}
