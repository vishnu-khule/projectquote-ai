import { Injectable, Logger } from "@nestjs/common";
import type { ProposalSection } from "@projectquote/schemas";
import { AIProviderFactory } from "../ai/providers/ai-provider.factory.js";

type NarrativeInput = {
  projectTitle: string;
  projectDescription?: string | null;
  lineItemNames: string[];
};

@Injectable()
export class ProposalNarrativeService {
  private readonly logger = new Logger(ProposalNarrativeService.name);

  constructor(private readonly aiFactory: AIProviderFactory) {}

  async enrichOverview(
    sections: ProposalSection[],
    input: NarrativeInput,
  ): Promise<ProposalSection[]> {
    if (process.env.PROPOSAL_LLM_NARRATIVE !== "true") {
      return sections;
    }
    const provider = this.aiFactory.create();
    if (process.env.AI_PROVIDER === "mock" || !process.env.OPENAI_API_KEY) {
      return sections;
    }

    const overview = sections.find((s) => s.id === "overview");
    if (!overview) return sections;

    const prompt = `Write 2 short professional paragraphs for a contractor proposal overview.
Project: ${input.projectTitle}
Description: ${input.projectDescription ?? "Not provided"}
Scope items: ${input.lineItemNames.join(", ") || "general works"}
Do not invent prices. Tone: clear, confident, India market.`;

    try {
      const result = await provider.chat([
        {
          role: "system",
          content:
            "You write proposal copy for trade contractors. Output plain text only.",
        },
        { role: "user", content: prompt },
      ]);
      if (!result.content?.trim()) return sections;
      return sections.map((s) =>
        s.id === "overview" ? { ...s, content: result.content.trim() } : s,
      );
    } catch (err) {
      this.logger.warn(
        `Proposal narrative skipped: ${err instanceof Error ? err.message : err}`,
      );
      return sections;
    }
  }
}
