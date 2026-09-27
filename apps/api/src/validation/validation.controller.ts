import { Controller, Param, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { CurrentUser } from "../common/current-user.decorator.js";
import type { JwtPayload } from "../auth/auth.types.js";
import { ValidationService } from "./validation.service.js";

@Controller("projects/:projectId")
@UseGuards(JwtAuthGuard)
export class ValidationController {
  constructor(private readonly validation: ValidationService) {}

  @Post("validate")
  validate(
    @CurrentUser() user: JwtPayload,
    @Param("projectId") projectId: string,
  ) {
    return this.validation.validateProject(user.orgId, projectId);
  }
}
