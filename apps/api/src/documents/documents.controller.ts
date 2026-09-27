import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { CurrentUser } from "../common/current-user.decorator.js";
import type { JwtPayload } from "../auth/auth.types.js";
import { DocumentsService } from "./documents.service.js";

@Controller()
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Post("projects/:projectId/documents")
  @UseInterceptors(FileInterceptor("file"))
  upload(
    @CurrentUser() user: JwtPayload,
    @Param("projectId") projectId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException("FILE_REQUIRED");
    }
    return this.documents.upload(user.orgId, projectId, file);
  }

  @Get("projects/:projectId/documents")
  list(
    @CurrentUser() user: JwtPayload,
    @Param("projectId") projectId: string,
  ) {
    return this.documents.listForProject(user.orgId, projectId);
  }

  @Get("documents/:id")
  get(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.documents.getById(user.orgId, id);
  }

  @Post("projects/:projectId/documents/reindex-embeddings")
  reindexEmbeddings(
    @CurrentUser() user: JwtPayload,
    @Param("projectId") projectId: string,
  ) {
    return this.documents.reindexEmbeddings(user.orgId, projectId);
  }
}
