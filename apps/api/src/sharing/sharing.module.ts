import { Module } from "@nestjs/common";
import { ProjectsModule } from "../projects/projects.module.js";
import { ValidationModule } from "../validation/validation.module.js";
import { SharingController } from "./sharing.controller.js";
import { SharingService } from "./sharing.service.js";

@Module({
  imports: [ProjectsModule, ValidationModule],
  controllers: [SharingController],
  providers: [SharingService],
})
export class SharingModule {}
