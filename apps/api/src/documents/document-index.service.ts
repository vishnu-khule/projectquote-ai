import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { EmbeddingService } from "./embedding.service.js";

type ChunkRow = { content: string };

@Injectable()
export class DocumentIndexService {
  private readonly logger = new Logger(DocumentIndexService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly embedding: EmbeddingService,
  ) {}

  async reindexProject(projectId: string): Promise<{ chunks: number }> {
    const documents = await this.prisma.document.findMany({
      where: { projectId, status: "completed" },
    });
    let chunks = 0;
    for (const doc of documents) {
      const meta = doc.metadata as Record<string, unknown>;
      const extraction = meta.extraction as { text?: string } | undefined;
      const text =
        extraction?.text ??
        (typeof meta.rawText === "string" ? meta.rawText : "");
      if (!text.trim()) continue;
      await this.indexFromExtraction(doc.id, text);
      const count = await this.prisma.documentChunk.count({
        where: { documentId: doc.id },
      });
      chunks += count;
    }
    return { chunks };
  }

  async indexFromExtraction(documentId: string, text: string) {
    const normalized = text.trim();
    if (!normalized) return;

    await this.prisma.documentChunk.deleteMany({ where: { documentId } });

    const chunks = this.chunkText(normalized, 900);
    for (const content of chunks) {
      const row = await this.prisma.documentChunk.create({
        data: {
          documentId,
          content,
          metadata: { length: content.length },
        },
      });
      await this.storeEmbedding(row.id, content);
    }
  }

  async search(projectId: string, query: string, limit = 5): Promise<string[]> {
    const vector = await this.embedding.embed(query);
    if (vector) {
      const fromVector = await this.vectorSearchProject(
        projectId,
        vector,
        limit,
      );
      if (fromVector.length > 0) return fromVector;
    }
    return this.keywordSearchProject(projectId, query, limit);
  }

  /** Cross-project retrieval within the same organization (excludes current project). */
  async searchOrganization(
    organizationId: string,
    query: string,
    excludeProjectId: string,
    limit = 3,
  ): Promise<string[]> {
    const vector = await this.embedding.embed(query);
    if (vector) {
      const fromVector = await this.vectorSearchOrg(
        organizationId,
        excludeProjectId,
        vector,
        limit,
      );
      if (fromVector.length > 0) return fromVector;
    }
    return this.keywordSearchOrg(
      organizationId,
      excludeProjectId,
      query,
      limit,
    );
  }

  private async storeEmbedding(chunkId: string, content: string) {
    const values = await this.embedding.embed(content);
    if (!values) return;
    const literal = this.embedding.toVectorLiteral(values);
    try {
      await this.prisma.$executeRawUnsafe(
        `UPDATE "DocumentChunk" SET embedding = $1::vector WHERE id = $2`,
        literal,
        chunkId,
      );
    } catch (err) {
      this.logger.warn(
        `Could not store embedding: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  private async vectorSearchProject(
    projectId: string,
    vector: number[],
    limit: number,
  ): Promise<string[]> {
    const literal = this.embedding.toVectorLiteral(vector);
    const rows = await this.prisma.$queryRawUnsafe<ChunkRow[]>(
      `SELECT dc.content
       FROM "DocumentChunk" dc
       INNER JOIN "Document" d ON d.id = dc."documentId"
       WHERE d."projectId" = $1::uuid
         AND d.status = 'completed'
         AND dc.embedding IS NOT NULL
       ORDER BY dc.embedding <=> $2::vector
       LIMIT $3`,
      projectId,
      literal,
      limit,
    );
    return rows.map((r) => r.content);
  }

  private async vectorSearchOrg(
    organizationId: string,
    excludeProjectId: string,
    vector: number[],
    limit: number,
  ): Promise<string[]> {
    const literal = this.embedding.toVectorLiteral(vector);
    const rows = await this.prisma.$queryRawUnsafe<ChunkRow[]>(
      `SELECT dc.content
       FROM "DocumentChunk" dc
       INNER JOIN "Document" d ON d.id = dc."documentId"
       INNER JOIN "Project" p ON p.id = d."projectId"
       WHERE p."organizationId" = $1::uuid
         AND p.id <> $2::uuid
         AND d.status = 'completed'
         AND dc.embedding IS NOT NULL
       ORDER BY dc.embedding <=> $3::vector
       LIMIT $4`,
      organizationId,
      excludeProjectId,
      literal,
      limit,
    );
    return rows.map((r) => r.content);
  }

  private async keywordSearchProject(
    projectId: string,
    query: string,
    limit: number,
  ): Promise<string[]> {
    const terms = this.terms(query);
    if (terms.length === 0) return [];

    const documents = await this.prisma.document.findMany({
      where: { projectId, status: "completed" },
      select: { id: true },
    });
    if (documents.length === 0) return [];

    const chunks = await this.prisma.documentChunk.findMany({
      where: { documentId: { in: documents.map((d) => d.id) } },
      take: 200,
    });

    return this.scoreChunks(chunks, terms, limit);
  }

  private async keywordSearchOrg(
    organizationId: string,
    excludeProjectId: string,
    query: string,
    limit: number,
  ): Promise<string[]> {
    const terms = this.terms(query);
    if (terms.length === 0) return [];

    const documents = await this.prisma.document.findMany({
      where: {
        status: "completed",
        project: { organizationId, id: { not: excludeProjectId } },
      },
      select: { id: true },
      take: 50,
    });
    if (documents.length === 0) return [];

    const chunks = await this.prisma.documentChunk.findMany({
      where: { documentId: { in: documents.map((d) => d.id) } },
      take: 300,
    });

    return this.scoreChunks(chunks, terms, limit);
  }

  private terms(query: string): string[] {
    return query
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 2)
      .slice(0, 8);
  }

  private scoreChunks(
    chunks: { content: string }[],
    terms: string[],
    limit: number,
  ): string[] {
    const scored = chunks
      .map((chunk) => ({
        content: chunk.content,
        score: terms.reduce(
          (acc, term) =>
            acc + (chunk.content.toLowerCase().includes(term) ? 1 : 0),
          0,
        ),
      }))
      .filter((c) => c.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scored.map((s) => s.content);
  }

  private chunkText(text: string, size: number): string[] {
    const paragraphs = text.split(/\n{2,}/);
    const out: string[] = [];
    let buf = "";
    for (const p of paragraphs) {
      if ((buf + p).length > size) {
        if (buf) out.push(buf.trim());
        buf = p;
      } else {
        buf = buf ? `${buf}\n\n${p}` : p;
      }
    }
    if (buf.trim()) out.push(buf.trim());
    return out.length > 0 ? out : [text.slice(0, size)];
  }
}
