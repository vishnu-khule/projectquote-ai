import { Module } from "@nestjs/common";
import { AiModule } from "../ai/ai.module.js";
import { ProjectsModule } from "../projects/projects.module.js";
import { ValidationModule } from "../validation/validation.module.js";
import { PdfService } from "../pdf/pdf.service.js";
import { ProposalBuilderService } from "./proposal-builder.service.js";
import { ProposalNarrativeService } from "./proposal-narrative.service.js";
import { ProposalsController } from "./proposals.controller.js";
import { ProposalsService } from "./proposals.service.js";

@Module({
  imports: [ProjectsModule, ValidationModule, AiModule],
  controllers: [ProposalsController],
  providers: [
    ProposalsService,
    ProposalBuilderService,
    ProposalNarrativeService,
    PdfService,
  ],
  exports: [ProposalsService],
})
export class ProposalsModule {}
