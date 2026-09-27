import { Module } from "@nestjs/common";
import { ProjectsModule } from "../projects/projects.module.js";
import { ProjectsEventsController } from "../projects/projects-events.controller.js";
import { DocumentEventsService } from "./document-events.service.js";
import { DocumentParserService } from "./document-parser.service.js";
import { DocumentProcessingQueue } from "./document-processing.queue.js";
import { DocumentsController } from "./documents.controller.js";
import { DocumentsService } from "./documents.service.js";
import { DocumentIndexService } from "./document-index.service.js";

@Module({
  imports: [ProjectsModule],
  controllers: [DocumentsController, ProjectsEventsController],
  providers: [
    DocumentsService,
    DocumentParserService,
    DocumentProcessingQueue,
    DocumentEventsService,
    DocumentIndexService,
  ],
  exports: [DocumentEventsService, DocumentIndexService],
})
export class DocumentsModule {}
