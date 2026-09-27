import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Res,
  StreamableFile,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { CurrentUser } from "../common/current-user.decorator.js";
import { ZodValidationPipe } from "../common/zod-validation.pipe.js";
import type { JwtPayload } from "../auth/auth.types.js";
import { ProposalsService } from "./proposals.service.js";
import {
  UpdateProposalSectionBodySchema,
  type UpdateProposalSectionBody,
} from "./proposals.schemas.js";

@Controller()
@UseGuards(JwtAuthGuard)
export class ProposalsController {
  constructor(private readonly proposals: ProposalsService) {}

  @Get("projects/:projectId/proposals/latest")
  getLatest(
    @CurrentUser() user: JwtPayload,
    @Param("projectId") projectId: string,
  ) {
    return this.proposals.getLatest(user.orgId, projectId);
  }

  @Post("projects/:projectId/proposals/generate")
  generate(
    @CurrentUser() user: JwtPayload,
    @Param("projectId") projectId: string,
  ) {
    return this.proposals.generate(user.orgId, projectId);
  }

  @Patch("proposals/:proposalId/sections/:sectionId")
  updateSection(
    @CurrentUser() user: JwtPayload,
    @Param("proposalId") proposalId: string,
    @Param("sectionId") sectionId: string,
    @Body(new ZodValidationPipe(UpdateProposalSectionBodySchema))
    body: UpdateProposalSectionBody,
  ) {
    return this.proposals.updateSection(
      user.orgId,
      proposalId,
      sectionId,
      body.content,
    );
  }

  @Post("proposals/:proposalId/approve")
  approve(
    @CurrentUser() user: JwtPayload,
    @Param("proposalId") proposalId: string,
  ) {
    return this.proposals.approve(user.orgId, proposalId, user.sub);
  }

  @Post("proposals/:proposalId/pdf")
  createPdf(
    @CurrentUser() user: JwtPayload,
    @Param("proposalId") proposalId: string,
  ) {
    return this.proposals.generatePdf(user.orgId, proposalId);
  }

  @Get("proposals/:proposalId/pdf")
  @Header("Content-Type", "application/pdf")
  async downloadPdf(
    @CurrentUser() user: JwtPayload,
    @Param("proposalId") proposalId: string,
    @Res({ passthrough: true }) _res: Response,
  ) {
    const { buffer, fileName } = await this.proposals.downloadPdf(
      user.orgId,
      proposalId,
    );
    return new StreamableFile(buffer, {
      type: "application/pdf",
      disposition: `attachment; filename="${fileName}"`,
    });
  }
}
