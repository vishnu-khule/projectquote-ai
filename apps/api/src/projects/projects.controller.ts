import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { CurrentUser } from "../common/current-user.decorator.js";
import { ZodValidationPipe } from "../common/zod-validation.pipe.js";
import type { JwtPayload } from "../auth/auth.types.js";
import { ProjectsService } from "./projects.service.js";
import {
  CreateProjectBodySchema,
  TransitionProjectStatusBodySchema,
  UpdateProjectBodySchema,
  type CreateProjectBody,
  type TransitionProjectStatusBody,
  type UpdateProjectBody,
} from "./projects.schemas.js";

@Controller("projects")
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Post()
  create(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(CreateProjectBodySchema)) body: CreateProjectBody,
  ) {
    return this.projects.create(user.orgId, body);
  }

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.projects.list(user.orgId);
  }

  @Get(":id")
  get(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.projects.getById(user.orgId, id);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdateProjectBodySchema)) body: UpdateProjectBody,
  ) {
    return this.projects.update(user.orgId, id, body);
  }

  @Post(":id/status")
  transitionStatus(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(TransitionProjectStatusBodySchema))
    body: TransitionProjectStatusBody,
  ) {
    return this.projects.transitionStatus(user.orgId, id, body);
  }
}
