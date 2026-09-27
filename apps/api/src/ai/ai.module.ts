import { Module } from "@nestjs/common";
import { DocumentsModule } from "../documents/documents.module.js";
import { ProjectsModule } from "../projects/projects.module.js";
import { ConversationAgent } from "./agents/conversation.agent.js";
import { ChatController } from "./chat.controller.js";
import { ChatService } from "./chat.service.js";
import { AIProviderFactory } from "./providers/ai-provider.factory.js";
import { AiBudgetService } from "./ai-budget.service.js";

@Module({
  imports: [ProjectsModule, DocumentsModule],
  controllers: [ChatController],
  providers: [
    ChatService,
    ConversationAgent,
    AIProviderFactory,
    AiBudgetService,
  ],
  exports: [ChatService, AIProviderFactory, AiBudgetService],
})
export class AiModule {}
