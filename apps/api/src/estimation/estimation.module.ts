import { Module } from "@nestjs/common";
import { ProjectsModule } from "../projects/projects.module.js";
import { EstimationController } from "./estimation.controller.js";
import { EstimationService } from "./estimation.service.js";
import { TierEngineService } from "./tier-engine.service.js";

@Module({
  imports: [ProjectsModule],
  controllers: [EstimationController],
  providers: [EstimationService, TierEngineService],
  exports: [EstimationService],
})
export class EstimationModule {}
