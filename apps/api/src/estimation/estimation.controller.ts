import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { CurrentUser } from "../common/current-user.decorator.js";
import { ZodValidationPipe } from "../common/zod-validation.pipe.js";
import type { JwtPayload } from "../auth/auth.types.js";
import { EstimationService } from "./estimation.service.js";
import {
  AddCatalogLineBodySchema,
  CreateLineItemBodySchema,
  ReplaceLineItemsBodySchema,
  UpdateLineItemBodySchema,
  type AddCatalogLineBody,
  type CreateLineItemBody,
  type LineItemInput,
  type ReplaceLineItemsBody,
  type UpdateLineItemBody,
} from "./estimation.schemas.js";

@Controller()
@UseGuards(JwtAuthGuard)
export class EstimationController {
  constructor(private readonly estimation: EstimationService) {}

  @Get("projects/:projectId/estimate")
  async getLatest(
    @CurrentUser() user: JwtPayload,
    @Param("projectId") projectId: string,
  ) {
    const estimate = await this.estimation.getLatest(user.orgId, projectId);
    return estimate ?? null;
  }

  @Post("projects/:projectId/estimate/generate")
  generate(
    @CurrentUser() user: JwtPayload,
    @Param("projectId") projectId: string,
  ) {
    return this.estimation.generateDraft(user.orgId, projectId);
  }

  @Get("projects/:projectId/estimate/tiers")
  listTiers(
    @CurrentUser() user: JwtPayload,
    @Param("projectId") projectId: string,
  ) {
    return this.estimation.listTierEstimates(user.orgId, projectId);
  }

  @Post("projects/:projectId/estimate/tiers/generate")
  generateTiers(
    @CurrentUser() user: JwtPayload,
    @Param("projectId") projectId: string,
  ) {
    return this.estimation.generateTierPackages(user.orgId, projectId);
  }

  @Put("estimates/:estimateId/line-items")
  replaceLineItems(
    @CurrentUser() user: JwtPayload,
    @Param("estimateId") estimateId: string,
    @Body(new ZodValidationPipe(ReplaceLineItemsBodySchema))
    body: ReplaceLineItemsBody,
  ) {
    return this.estimation.replaceLineItems(
      user.orgId,
      estimateId,
      body.lineItems,
    );
  }

  @Post("estimates/:estimateId/line-items")
  addLineItem(
    @CurrentUser() user: JwtPayload,
    @Param("estimateId") estimateId: string,
    @Body(new ZodValidationPipe(CreateLineItemBodySchema)) body: CreateLineItemBody,
  ) {
    return this.estimation.addLineItem(user.orgId, estimateId, body);
  }

  @Post("estimates/:estimateId/line-items/from-catalog")
  addFromCatalog(
    @CurrentUser() user: JwtPayload,
    @Param("estimateId") estimateId: string,
    @Body(new ZodValidationPipe(AddCatalogLineBodySchema)) body: AddCatalogLineBody,
  ) {
    return this.estimation.addLineItemFromCatalog(
      user.orgId,
      estimateId,
      body.catalogItemId,
      body.quantity,
    );
  }

  @Patch("estimates/:estimateId/line-items/:itemId")
  updateLineItem(
    @CurrentUser() user: JwtPayload,
    @Param("estimateId") estimateId: string,
    @Param("itemId") itemId: string,
    @Body(new ZodValidationPipe(UpdateLineItemBodySchema)) body: UpdateLineItemBody,
  ) {
    return this.estimation.updateLineItem(
      user.orgId,
      estimateId,
      itemId,
      body as Partial<LineItemInput>,
    );
  }

  @Delete("estimates/:estimateId/line-items/:itemId")
  deleteLineItem(
    @CurrentUser() user: JwtPayload,
    @Param("estimateId") estimateId: string,
    @Param("itemId") itemId: string,
  ) {
    return this.estimation.deleteLineItem(user.orgId, estimateId, itemId);
  }

  @Post("estimates/:estimateId/line-items/:itemId/confirm")
  confirmLineItem(
    @CurrentUser() user: JwtPayload,
    @Param("estimateId") estimateId: string,
    @Param("itemId") itemId: string,
  ) {
    return this.estimation.confirmLineItem(user.orgId, estimateId, itemId);
  }
}
