import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import type { JwtPayload } from "../auth/auth.types.js";
import { CurrentUser } from "../common/current-user.decorator.js";
import { ZodValidationPipe } from "../common/zod-validation.pipe.js";
import { OrganizationService } from "./organization.service.js";
import {
  UpdateOrganizationSettingsSchema,
  type UpdateOrganizationSettingsBody,
} from "./organization.schemas.js";

@Controller("organization")
@UseGuards(JwtAuthGuard)
export class OrganizationController {
  constructor(private readonly organization: OrganizationService) {}

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
}
