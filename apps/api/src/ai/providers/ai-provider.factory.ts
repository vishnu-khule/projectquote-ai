import { Injectable } from "@nestjs/common";
import type { AIProvider } from "./ai-provider.interface.js";
import { MockAIProvider } from "./mock.provider.js";
import { OpenAIProvider } from "./openai.provider.js";

@Injectable()
export class AIProviderFactory {
  create(): AIProvider {
    const provider = process.env.AI_PROVIDER ?? "openai";
    if (provider === "mock" || !process.env.OPENAI_API_KEY) {
      return new MockAIProvider();
    }
    return new OpenAIProvider();
  }
}
