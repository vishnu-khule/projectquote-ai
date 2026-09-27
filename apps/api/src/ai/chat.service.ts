import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { Response } from "express";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaService } from "../prisma/prisma.service.js";
import { ProjectsService } from "../projects/projects.service.js";
import { DocumentIndexService } from "../documents/document-index.service.js";
import { AiBudgetService } from "./ai-budget.service.js";
import { ConversationAgent } from "./agents/conversation.agent.js";
import type { ChatMessage } from "./providers/ai-provider.interface.js";

function resolveRepoRoot(): string {
  const candidates = [
    process.cwd(),
    path.resolve(process.cwd(), ".."),
    path.resolve(process.cwd(), "../.."),
  ];
  for (const candidate of candidates) {
    if (existsSync(path.join(candidate, "config/project-types"))) {
      return candidate;
    }
  }
  return process.cwd();
}

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projects: ProjectsService,
    private readonly conversationAgent: ConversationAgent,
    private readonly documentIndex: DocumentIndexService,
    private readonly aiBudget: AiBudgetService,
  ) {}

  async listMessages(orgId: string, projectId: string) {
    await this.projects.assertProjectAccess(orgId, projectId);
    const conversation = await this.prisma.aiConversation.findUnique({
      where: { projectId },
      include: {
        messages: { orderBy: { createdAt: "asc" }, take: 100 },
      },
    });
    return conversation?.messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      metadata: m.metadata,
      createdAt: m.createdAt.toISOString(),
    })) ?? [];
  }

  async sendMessage(
    orgId: string,
    projectId: string,
    message: string,
    stream: boolean,
    res?: Response,
  ) {
    await this.aiBudget.assertWithinBudget(orgId);
    const project = await this.getProject(orgId, projectId);
    const conversation = await this.getOrCreateConversation(projectId);

    const historyBefore = await this.loadHistory(conversation.id);
    await this.saveMessage(conversation.id, "user", message);

    const context = await this.buildContext(orgId, project, message);

    if (stream && res) {
      return this.sendStreaming(
        orgId,
        projectId,
        project,
        conversation.id,
        message,
        historyBefore,
        context,
        res,
      );
    }

    const started = Date.now();
    let agentResult;
    try {
      agentResult = await this.conversationAgent.run(
        context,
        historyBefore,
        message,
      );
    } catch (err) {
      throw new ServiceUnavailableException(
        err instanceof Error ? err.message : "AI unavailable",
      );
    }

    await this.saveMessage(
      conversation.id,
      "assistant",
      agentResult.output.reply,
      { agent: agentResult },
    );

    await this.persistAgentInsights(projectId, project, agentResult.output);

    await this.recordRun(projectId, {
      agent: "conversation",
      promptVersion: agentResult.promptVersion,
      model: agentResult.model,
      status: "success",
      latencyMs: Date.now() - started,
      output: agentResult.output,
      inputTokens: agentResult.usage?.input,
      outputTokens: agentResult.usage?.output,
    });

    return {
      reply: agentResult.output.reply,
      agent: agentResult.output,
      missingInformation: agentResult.output.missingInformation,
      suggestedQuestions: agentResult.output.suggestedQuestions,
    };
  }

  private async sendStreaming(
    orgId: string,
    projectId: string,
    project: Awaited<ReturnType<ChatService["getProject"]>>,
    conversationId: string,
    message: string,
    history: ChatMessage[],
    context: Awaited<ReturnType<ChatService["buildContext"]>>,
    res: Response,
  ) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const started = Date.now();
    let fullReply = "";

    try {
      const { stream: tokenStream, model } =
        await this.conversationAgent.streamReply(context, history, message);

      for await (const chunk of tokenStream) {
        fullReply += chunk.text;
        res.write(
          `data: ${JSON.stringify({ type: "token", text: chunk.text })}\n\n`,
        );
      }

      const agentResult = await this.conversationAgent.run(
        context,
        history,
        message,
      );
      fullReply = agentResult.output.reply || fullReply;

      await this.saveMessage(conversationId, "assistant", fullReply, {
        agent: agentResult,
      });
      await this.persistAgentInsights(projectId, project, agentResult.output);

      await this.recordRun(projectId, {
        agent: "conversation",
        promptVersion: agentResult.promptVersion,
        model: agentResult.model || model,
        status: "success",
        latencyMs: Date.now() - started,
        output: agentResult.output,
        inputTokens: agentResult.usage?.input,
        outputTokens: agentResult.usage?.output,
      });

      res.write(
        `data: ${JSON.stringify({
          type: "done",
          reply: fullReply,
          agent: agentResult.output,
        })}\n\n`,
      );
    } catch (err) {
      res.write(
        `data: ${JSON.stringify({
          type: "error",
          message: err instanceof Error ? err.message : "Stream failed",
        })}\n\n`,
      );
    } finally {
      res.end();
    }
  }

  private async getProject(orgId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        documents: { where: { status: "completed" }, take: 5 },
      },
    });
    if (!project || project.organizationId !== orgId) {
      throw new NotFoundException("Project not found");
    }
    return project;
  }

  private async getOrCreateConversation(projectId: string) {
    return this.prisma.aiConversation.upsert({
      where: { projectId },
      create: { projectId },
      update: {},
    });
  }

  private async loadHistory(conversationId: string): Promise<ChatMessage[]> {
    const messages = await this.prisma.aiMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      take: 20,
    });
    return messages.map((m) => ({
      role: m.role as ChatMessage["role"],
      content: m.content,
    }));
  }

  private async buildContext(
    orgId: string,
    project: Awaited<ReturnType<ChatService["getProject"]>>,
    query?: string,
  ) {
    const requirements = (project.requirements ?? {}) as Record<string, unknown>;
    const [ragChunks, orgRagChunks] = query
      ? await Promise.all([
          this.documentIndex.search(project.id, query),
          this.documentIndex.searchOrganization(orgId, query, project.id, 3),
        ])
      : [[], []];
    const documentSummaries = [
      ...ragChunks.map((c, i) => `RAG chunk ${i + 1}:\n${c.slice(0, 1200)}`),
      ...orgRagChunks.map(
        (c, i) => `Org knowledge ${i + 1}:\n${c.slice(0, 1200)}`,
      ),
      ...project.documents.map((doc) => {
      const meta = doc.metadata as Record<string, unknown>;
      const extraction = meta.extraction;
        return `File: ${doc.fileName}\n${JSON.stringify(extraction ?? {}).slice(0, 1500)}`;
      }),
    ];

    let requiredFields: string[] = [];
    try {
      const configPath = path.join(
        resolveRepoRoot(),
        "config/project-types",
        `${project.projectType}.json`,
      );
      const raw = await readFile(configPath, "utf8");
      const config = JSON.parse(raw) as { requiredFields?: string[] };
      requiredFields = config.requiredFields ?? [];
    } catch {
      /* unknown project type config */
    }

    return {
      projectTitle: project.title,
      projectType: project.projectType,
      projectDescription: project.projectDescription,
      location: project.location,
      status: project.status,
      documentSummaries,
      requirements: { ...requirements, _requiredFields: requiredFields },
    };
  }

  private async persistAgentInsights(
    projectId: string,
    project: Awaited<ReturnType<ChatService["getProject"]>>,
    output: {
      projectType?: string;
      identified: Record<string, unknown>;
      missingInformation: string[];
    },
  ) {
    const requirements = (project.requirements ?? {}) as Record<string, unknown>;
    const merged = {
      ...requirements,
      ...output.identified,
      _missingInformation: output.missingInformation,
      _lastAgentAt: new Date().toISOString(),
    };

    const updates: Prisma.ProjectUpdateInput = {
      requirements: merged as Prisma.InputJsonValue,
    };

    if (output.projectType && output.projectType !== project.projectType) {
      updates.projectType = output.projectType;
    }

    const loc = output.identified.location;
    if (typeof loc === "string" && loc.trim()) {
      updates.location = loc;
    }

    await this.prisma.project.update({
      where: { id: projectId },
      data: updates,
    });

    if (output.missingInformation.length === 0) {
      try {
        await this.projects.transitionStatusBySystem(
          project.organizationId,
          projectId,
          "READY_FOR_ESTIMATION",
        );
      } catch {
        /* invalid transition */
      }
    } else if (project.status === "DRAFT" || project.status === "ANALYZING") {
      try {
        await this.projects.transitionStatusBySystem(
          project.organizationId,
          projectId,
          "WAITING_FOR_INFORMATION",
        );
      } catch {
        /* ignore */
      }
    }
  }

  private async saveMessage(
    conversationId: string,
    role: string,
    content: string,
    metadata?: Record<string, unknown>,
  ) {
    await this.prisma.aiConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
    return this.prisma.aiMessage.create({
      data: {
        conversationId,
        role,
        content,
        metadata: (metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  private async recordRun(
    projectId: string,
    data: {
      agent: string;
      promptVersion: string;
      model: string;
      status: string;
      latencyMs: number;
      output: unknown;
      inputTokens?: number;
      outputTokens?: number;
    },
  ) {
    await this.prisma.aiRun.create({
      data: {
        projectId,
        agent: data.agent,
        promptVersion: data.promptVersion,
        model: data.model,
        status: data.status,
        latencyMs: data.latencyMs,
        inputTokens: data.inputTokens,
        outputTokens: data.outputTokens,
        output: data.output as Prisma.InputJsonValue,
      },
    });
  }
}
