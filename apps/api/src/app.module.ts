import { Module } from "@nestjs/common";
import { AiModule } from "./ai/ai.module.js";
import { AuthModule } from "./auth/auth.module.js";
import { DocumentsModule } from "./documents/documents.module.js";
import { EstimationModule } from "./estimation/estimation.module.js";
import { ProposalsModule } from "./proposals/proposals.module.js";
import { SharingModule } from "./sharing/sharing.module.js";
import { ValidationModule } from "./validation/validation.module.js";
import { CatalogModule } from "./catalog/catalog.module.js";
import { HealthController } from "./health.controller.js";
import { PrismaModule } from "./prisma/prisma.module.js";
import { ProjectsModule } from "./projects/projects.module.js";
import { StorageModule } from "./storage/storage.module.js";

@Module({
  imports: [
    PrismaModule,
    StorageModule,
    AuthModule,
    ProjectsModule,
    DocumentsModule,
    AiModule,
    EstimationModule,
    ProposalsModule,
    SharingModule,
    ValidationModule,
    CatalogModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
