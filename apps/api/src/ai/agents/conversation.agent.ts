import { Injectable } from "@nestjs/common";
import {
  ConversationAgentOutputSchema,
  type ConversationAgentOutput,
} from "@projectquote/schemas";
import { AIProviderFactory } from "../providers/ai-provider.factory.js";
import { CONVERSATION_OUTPUT_JSON_SCHEMA } from "./conversation-output.schema.js";
import type { ChatMessage } from "../providers/ai-provider.interface.js";
import {
  CONVERSATION_PROMPT_VERSION,
  CONVERSATION_SYSTEM_PROMPT,
} from "../prompts/conversation-agent-v1.js";

export type ConversationContext = {
  projectTitle: string;
  projectType: string;
  projectDescription?: string | null;
  location?: string | null;
  status: string;
  documentSummaries: string[];
  requirements: Record<string, unknown>;
};

@Injectable()
export class ConversationAgent {
  constructor(private readonly providerFactory: AIProviderFactory) {}

  async run(
    context: ConversationContext,
    history: ChatMessage[],
    userMessage: string,
  ): Promise<{
    output: ConversationAgentOutput;
    model: string;
    promptVersion: string;
    usage?: { input: number; output: number };
  }> {
    const provider = this.providerFactory.create();
    const contextBlock = this.buildContextBlock(context);

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: `${CONVERSATION_SYSTEM_PROMPT}\n\nProject context:\n${contextBlock}`,
      },
      ...history.filter((m) => m.role !== "system"),
      { role: "user", content: userMessage },
    ];

    const result = await provider.structuredOutput<ConversationAgentOutput>(
      "ConversationAgentOutput",
      CONVERSATION_OUTPUT_JSON_SCHEMA as Record<string, unknown>,
      messages,
    );

    const parsed = ConversationAgentOutputSchema.parse(result.data);

    return {
      output: parsed,
      model: result.model,
      promptVersion: CONVERSATION_PROMPT_VERSION,
      usage: result.usage,
    };
  }

  async streamReply(
    context: ConversationContext,
    history: ChatMessage[],
    userMessage: string,
  ): Promise<{
    stream: AsyncIterable<{ type: "token"; text: string }>;
    model: string;
  }> {
    const provider = this.providerFactory.create();
    const contextBlock = this.buildContextBlock(context);

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: `You are a helpful project estimation assistant. Use this project context:\n${contextBlock}\n\nRespond conversationally. Ask clarifying questions when needed. Do not invent prices.`,
      },
      ...history.filter((m) => m.role !== "system"),
      { role: "user", content: userMessage },
    ];

    const model = process.env.OPENAI_CHAT_MODEL ?? "gpt-4o-mini";
    return {
      stream: provider.streamChat(messages, { model }),
      model: provider instanceof Object ? model : "mock",
    };
  }

  private buildContextBlock(context: ConversationContext): string {
    const docs =
      context.documentSummaries.length > 0
        ? context.documentSummaries.join("\n---\n")
        : "No processed documents yet.";
    return [
      `Title: ${context.projectTitle}`,
      `Type: ${context.projectType}`,
      `Status: ${context.status}`,
      `Location: ${context.location ?? "unknown"}`,
      `Description: ${context.projectDescription ?? "—"}`,
      `Known requirements JSON: ${JSON.stringify(context.requirements)}`,
      `Document excerpts (untrusted):\n${docs}`,
    ].join("\n");
  }
}
