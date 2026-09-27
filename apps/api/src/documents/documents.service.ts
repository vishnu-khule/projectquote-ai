import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service.js";
import { ProjectsService } from "../projects/projects.service.js";
import { StorageService } from "../storage/storage.service.js";
import { DocumentIndexService } from "./document-index.service.js";
import { DocumentProcessingQueue } from "./document-processing.queue.js";
import { validateUpload } from "./file-validation.js";

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly projects: ProjectsService,
    private readonly processingQueue: DocumentProcessingQueue,
    private readonly documentIndex: DocumentIndexService,
  ) {}

  async reindexEmbeddings(orgId: string, projectId: string) {
    await this.projects.assertProjectAccess(orgId, projectId);
    return this.documentIndex.reindexProject(projectId);
  }

  async upload(
    orgId: string,
    projectId: string,
    file: Express.Multer.File,
  ) {
    await this.projects.assertProjectAccess(orgId, projectId);

    try {
      validateUpload(file);
    } catch (err) {
      const code = err instanceof Error ? err.message : "INVALID_FILE";
      throw new BadRequestException({ code, message: code });
    }

    const s3Key = this.storage.buildDocumentKey(
      orgId,
      projectId,
      file.originalname,
    );
    await this.storage.putObject(s3Key, file.buffer, file.mimetype);

    const document = await this.prisma.document.create({
      data: {
        projectId,
        fileName: file.originalname,
        mimeType: file.mimetype,
        s3Key,
        status: "queued",
        metadata: { size: file.size },
      },
    });

    try {
      await this.projects.transitionStatusBySystem(
        orgId,
        projectId,
        "DOCUMENT_PROCESSING",
      );
    } catch {
      /* already processing */
    }

    const jobId = await this.processingQueue.enqueue({
      documentId: document.id,
      projectId,
      organizationId: orgId,
    });

    const updated = await this.prisma.document.update({
      where: { id: document.id },
      data: {
        metadata: {
          size: file.size,
          jobId,
        } as Prisma.InputJsonValue,
      },
    });

    return {
      document: this.toDto(updated),
      jobId,
      status: "queued",
    };
  }

  async listForProject(orgId: string, projectId: string) {
    await this.projects.assertProjectAccess(orgId, projectId);
    const docs = await this.prisma.document.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });
    return docs.map((d) => this.toDto(d));
  }

  async getById(orgId: string, documentId: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: { project: true },
    });
    if (!doc) {
      throw new NotFoundException("Document not found");
    }
    if (doc.project.organizationId !== orgId) {
      throw new NotFoundException("Document not found");
    }
    return this.toDto(doc);
  }

  private toDto(doc: {
    id: string;
    projectId: string;
    fileName: string;
    mimeType: string;
    status: string;
    metadata: unknown;
    createdAt: Date;
  }) {
    const meta = (doc.metadata ?? {}) as Record<string, unknown>;
    return {
      id: doc.id,
      projectId: doc.projectId,
      fileName: doc.fileName,
      mimeType: doc.mimeType,
      status: doc.status,
      jobId: meta.jobId as string | undefined,
      extraction: meta.extraction,
      error: meta.error as string | undefined,
      createdAt: doc.createdAt.toISOString(),
    };
  }
}
