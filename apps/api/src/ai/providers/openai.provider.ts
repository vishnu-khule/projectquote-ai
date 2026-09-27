import OpenAI from "openai";
import type {
  AIProvider,
  ChatMessage,
  ChatResult,
  StreamChunk,
} from "./ai-provider.interface.js";

export class OpenAIProvider implements AIProvider {
  private readonly client: OpenAI;
  private readonly defaultChatModel: string;
  private readonly reasoningModel: string;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is required for OpenAI provider");
    }
    this.client = new OpenAI({ apiKey });
    this.defaultChatModel =
      process.env.OPENAI_CHAT_MODEL ?? "gpt-4o-mini";
    this.reasoningModel =
      process.env.OPENAI_REASONING_MODEL ?? "gpt-4o";
  }

  async chat(
    messages: ChatMessage[],
    options?: { model?: string },
  ): Promise<ChatResult> {
    const model = options?.model ?? this.defaultChatModel;
    const response = await this.client.chat.completions.create({
      model,
      messages,
    });
    const choice = response.choices[0];
    return {
      content: choice?.message?.content ?? "",
      model,
      inputTokens: response.usage?.prompt_tokens,
      outputTokens: response.usage?.completion_tokens,
    };
  }

  async *streamChat(
    messages: ChatMessage[],
    options?: { model?: string },
  ): AsyncIterable<StreamChunk> {
    const model = options?.model ?? this.defaultChatModel;
    const stream = await this.client.chat.completions.create({
      model,
      messages,
      stream: true,
    });
    for await (const event of stream) {
      const delta = event.choices[0]?.delta?.content;
      if (delta) {
        yield { type: "token", text: delta };
      }
    }
  }

  async structuredOutput<T>(
    schemaName: string,
    schema: Record<string, unknown>,
    messages: ChatMessage[],
    options?: { model?: string },
  ): Promise<{
    data: T;
    model: string;
    usage?: { input: number; output: number };
  }> {
    const model = options?.model ?? this.reasoningModel;
    const response = await this.client.chat.completions.create({
      model,
      messages: [
        ...messages,
        {
          role: "system",
          content: `Respond with a single JSON object named ${schemaName} matching this schema: ${JSON.stringify(schema)}`,
        },
      ],
      response_format: { type: "json_object" },
    });
    const raw = response.choices[0]?.message?.content ?? "{}";
    const data = JSON.parse(raw) as T;
    return {
      data,
      model,
      usage: response.usage
        ? {
            input: response.usage.prompt_tokens ?? 0,
            output: response.usage.completion_tokens ?? 0,
          }
        : undefined,
    };
  }
}
