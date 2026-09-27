import { z } from "zod";

export const IsoDateTimeSchema = z.string().datetime({ offset: true });

export const MoneySchema = z.object({
  amount: z.string().regex(/^-?\d+(\.\d{1,4})?$/),
  currency: z.string().length(3),
});

export const SourceRefSchema = z.object({
  type: z.enum([
    "user",
    "document",
    "catalog",
    "historical",
    "ai_suggestion",
    "system",
  ]),
  documentId: z.string().uuid().optional(),
  page: z.number().int().positive().optional(),
  fieldPath: z.string().optional(),
  excerpt: z.string().max(2000).optional(),
  confidence: z.number().min(0).max(1).optional(),
});

export const AgentOutputEnvelopeSchema = z.object({
  status: z.enum(["success", "partial", "error"]),
  data: z.record(z.unknown()),
  warnings: z.array(z.string()).default([]),
  missingInformation: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1),
  sources: z.array(SourceRefSchema).default([]),
  agent: z.string(),
  promptVersion: z.string(),
  timestamp: IsoDateTimeSchema,
});

export type SourceRef = z.infer<typeof SourceRefSchema>;
export type AgentOutputEnvelope = z.infer<typeof AgentOutputEnvelopeSchema>;
