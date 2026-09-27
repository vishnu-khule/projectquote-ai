import type {
  AIProvider,
  ChatMessage,
  ChatResult,
  StreamChunk,
} from "./ai-provider.interface.js";

export class MockAIProvider implements AIProvider {
  async chat(messages: ChatMessage[]): Promise<ChatResult> {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    return {
      content: `Thanks — I noted: "${lastUser?.content ?? ""}". Please share kitchen dimensions and city so I can prepare an estimate.`,
      model: "mock",
    };
  }

  async *streamChat(messages: ChatMessage[]): AsyncIterable<StreamChunk> {
    const result = await this.chat(messages);
    for (const word of result.content.split(" ")) {
      yield { type: "token", text: `${word} ` };
    }
  }

  async structuredOutput<T>(
    _schemaName: string,
    _schema: Record<string, unknown>,
    messages: ChatMessage[],
  ): Promise<{ data: T; model: string }> {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const text = lastUser?.content ?? "";
    const data = {
      reply: `Thanks — I noted your message. What are the project dimensions and location?`,
      projectType: text.toLowerCase().includes("kitchen")
        ? "interior-modular-kitchen"
        : undefined,
      identified: {},
      missingInformation: ["dimensions", "location"],
      suggestedQuestions: [
        "What are the length and width of the space?",
        "Which city is the project in?",
      ],
      confidence: 0.5,
    } as T;
    return { data, model: "mock" };
  }
}
