import { Module } from "@nestjs/common";
import { ProjectsModule } from "../projects/projects.module.js";
import { ValidationController } from "./validation.controller.js";
import { ValidationService } from "./validation.service.js";

@Module({
  imports: [ProjectsModule],
  controllers: [ValidationController],
  providers: [ValidationService],
  exports: [ValidationService],
})
export class ValidationModule {}
