import { Injectable, Logger } from "@nestjs/common";
import OpenAI from "openai";

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private client: OpenAI | null = null;

  private getClient(): OpenAI | null {
    const key = process.env.OPENAI_API_KEY?.trim();
    if (!key) return null;
    if (!this.client) {
      this.client = new OpenAI({ apiKey: key });
    }
    return this.client;
  }

  isEnabled(): boolean {
    return Boolean(this.getClient());
  }

  async embed(text: string): Promise<number[] | null> {
    const client = this.getClient();
    if (!client) return null;
    const model =
      process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small";
    try {
      const res = await client.embeddings.create({
        model,
        input: text.slice(0, 8000),
      });
      return res.data[0]?.embedding ?? null;
    } catch (err) {
      this.logger.warn(
        `Embedding failed: ${err instanceof Error ? err.message : err}`,
      );
      return null;
    }
  }

  toVectorLiteral(values: number[]): string {
    return `[${values.join(",")}]`;
  }
}
