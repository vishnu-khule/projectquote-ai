import { z } from "zod";

export const ConversationAgentOutputSchema = z.object({
  reply: z.string().min(1),
  projectType: z.string().optional(),
  identified: z.record(z.unknown()).default({}),
  missingInformation: z.array(z.string()).default([]),
  suggestedQuestions: z.array(z.string()).max(5).default([]),
  confidence: z.number().min(0).max(1),
});

export type ConversationAgentOutput = z.infer<
  typeof ConversationAgentOutputSchema
>;
