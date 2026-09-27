import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { Queue, Worker } from "bullmq";
import { PrismaService } from "../prisma/prisma.service.js";
import { StorageService } from "../storage/storage.service.js";
import { DocumentEventsService } from "./document-events.service.js";
import { DocumentParserService } from "./document-parser.service.js";
import { DocumentIndexService } from "./document-index.service.js";
import { ProjectsService } from "../projects/projects.service.js";

export type DocumentJobPayload = {
  documentId: string;
  projectId: string;
  organizationId: string;
};

const QUEUE_NAME = "document-processing";

@Injectable()
export class DocumentProcessingQueue
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(DocumentProcessingQueue.name);
  private queue: Queue<DocumentJobPayload> | null = null;
  private worker: Worker<DocumentJobPayload> | null = null;
  private readonly inlineMode: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly parser: DocumentParserService,
    private readonly projects: ProjectsService,
    private readonly events: DocumentEventsService,
    private readonly documentIndex: DocumentIndexService,
  ) {
    this.inlineMode = !process.env.REDIS_URL;
    if (this.inlineMode) {
      this.logger.warn(
        "REDIS_URL not set — document jobs run inline (dev only)",
      );
    }
  }

  onModuleInit() {
    if (this.inlineMode) return;
    const connection = { url: process.env.REDIS_URL! };
    this.queue = new Queue<DocumentJobPayload>(QUEUE_NAME, { connection });
    this.worker = new Worker<DocumentJobPayload>(
      QUEUE_NAME,
      async (job) => this.processJob(job.data, job.id!),
      { connection },
    );
    this.worker.on("failed", (job, err) => {
      this.logger.error(`Job ${job?.id} failed: ${err.message}`);
    });
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.queue?.close();
  }

  async enqueue(payload: DocumentJobPayload): Promise<string> {
    if (this.inlineMode) {
      const jobId = `inline-${payload.documentId}`;
      setImmediate(() => {
        this.processJob(payload, jobId).catch((err) =>
          this.logger.error(err),
        );
      });
      return jobId;
    }
    const job = await this.queue!.add("process", payload, {
      removeOnComplete: 100,
      removeOnFail: 50,
    });
    return job.id!;
  }

  private async processJob(data: DocumentJobPayload, jobId: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id: data.documentId },
    });
    if (!doc) return;

    await this.prisma.document.update({
      where: { id: doc.id },
      data: { status: "processing" },
    });
    this.publish(data.projectId, doc.id, jobId, "processing");

    try {
      await this.projects.transitionStatusBySystem(
        data.organizationId,
        data.projectId,
        "ANALYZING",
      );
    } catch {
      // Project may already be past DOCUMENT_PROCESSING
    }

    try {
      const buffer = await this.storage.getObjectBuffer(doc.s3Key);
      const extraction = await this.parser.parse(
        doc.mimeType,
        buffer,
        doc.fileName,
      );

      await this.prisma.document.update({
        where: { id: doc.id },
        data: {
          status: "completed",
          metadata: {
            jobId,
            extraction,
            processedAt: new Date().toISOString(),
          } as Prisma.InputJsonValue,
        },
      });

      const indexText = JSON.stringify(extraction);
      await this.documentIndex.indexFromExtraction(doc.id, indexText);

      await this.projects.transitionStatusBySystem(
        data.organizationId,
        data.projectId,
        "WAITING_FOR_INFORMATION",
      );

      this.publish(
        data.projectId,
        doc.id,
        jobId,
        "completed",
        extraction,
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Document processing failed";
      await this.prisma.document.update({
        where: { id: doc.id },
        data: {
          status: "failed",
          metadata: { jobId, error: message },
        },
      });
      try {
        await this.projects.transitionStatusBySystem(
          data.organizationId,
          data.projectId,
          "DOCUMENT_PROCESSING_FAILED",
        );
      } catch {
        /* ignore invalid transition */
      }
      this.publish(data.projectId, doc.id, jobId, "failed", undefined, message);
    }
  }

  private publish(
    projectId: string,
    documentId: string,
    jobId: string,
    status: string,
    extraction?: unknown,
    error?: string,
  ) {
    this.events.emit({
      type: "document.job",
      projectId,
      documentId,
      jobId,
      status,
      extraction,
      error,
    });
  }
}
