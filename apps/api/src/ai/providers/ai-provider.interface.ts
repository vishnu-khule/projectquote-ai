export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ChatResult = {
  content: string;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
};

export type StreamChunk = {
  type: "token";
  text: string;
};

export interface AIProvider {
  chat(messages: ChatMessage[], options?: { model?: string }): Promise<ChatResult>;
  streamChat(
    messages: ChatMessage[],
    options?: { model?: string },
  ): AsyncIterable<StreamChunk>;
  structuredOutput<T>(
    schemaName: string,
    schema: Record<string, unknown>,
    messages: ChatMessage[],
    options?: { model?: string },
  ): Promise<{ data: T; model: string; usage?: { input: number; output: number } }>;
}
