import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class DocumentIndexService {
  constructor(private readonly prisma: PrismaService) {}

  async indexFromExtraction(documentId: string, text: string) {
    const normalized = text.trim();
    if (!normalized) return;

    await this.prisma.documentChunk.deleteMany({ where: { documentId } });

    const chunks = this.chunkText(normalized, 900);
    for (const content of chunks) {
      await this.prisma.documentChunk.create({
        data: {
          documentId,
          content,
          metadata: { length: content.length },
        },
      });
    }
  }

  async search(projectId: string, query: string, limit = 5): Promise<string[]> {
    const terms = query
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 2)
      .slice(0, 8);
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
