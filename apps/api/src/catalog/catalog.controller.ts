import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { CurrentUser } from "../common/current-user.decorator.js";
import { ZodValidationPipe } from "../common/zod-validation.pipe.js";
import type { JwtPayload } from "../auth/auth.types.js";
import { CatalogService } from "./catalog.service.js";
import {
  CreateCatalogItemSchema,
  type CreateCatalogItemBody,
} from "./catalog.schemas.js";

@Controller("catalog/items")
@UseGuards(JwtAuthGuard)
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  list(
    @CurrentUser() user: JwtPayload,
    @Query("kind") kind?: string,
  ) {
    const normalized =
      kind === "material" || kind === "labour" ? kind : undefined;
    return this.catalog.list(user.orgId, normalized);
  }

  @Post()
  create(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(CreateCatalogItemSchema)) body: CreateCatalogItemBody,
  ) {
    return this.catalog.create(user.orgId, body);
  }
}
