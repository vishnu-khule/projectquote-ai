import { Body, Controller, Post } from "@nestjs/common";
import { ZodValidationPipe } from "../common/zod-validation.pipe.js";
import { OrganizationInviteService } from "./organization-invite.service.js";
import {
  AcceptInviteSchema,
  type AcceptInviteBody,
} from "./organization.schemas.js";

@Controller("organization")
export class OrganizationPublicController {
  constructor(private readonly invites: OrganizationInviteService) {}

  @Post("accept-invite")
  acceptInvite(
    @Body(new ZodValidationPipe(AcceptInviteSchema)) body: AcceptInviteBody,
  ) {
    return this.invites.accept(body);
  }
}
