import { Module } from "@nestjs/common";
import { ProjectsModule } from "../projects/projects.module.js";
import { ValidationModule } from "../validation/validation.module.js";
import { PdfService } from "../pdf/pdf.service.js";
import { ProposalBuilderService } from "./proposal-builder.service.js";
import { ProposalsController } from "./proposals.controller.js";
import { ProposalsService } from "./proposals.service.js";

@Module({
  imports: [ProjectsModule, ValidationModule],
  controllers: [ProposalsController],
  providers: [ProposalsService, ProposalBuilderService, PdfService],
  exports: [ProposalsService],
})
export class ProposalsModule {}
