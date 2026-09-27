import { z } from "zod";
import { SourceRefSchema } from "./common.js";

export const DocumentProcessingStatusSchema = z.enum([
  "uploaded",
  "queued",
  "processing",
  "completed",
  "failed",
]);

export const ExtractedProjectDataSchema = z.object({
  projectType: z.string().optional(),
  dimensions: z
    .object({
      length: z.number().optional(),
      width: z.number().optional(),
      height: z.number().optional(),
      unit: z.string().optional(),
    })
    .optional(),
  materials: z.array(z.record(z.unknown())).default([]),
  scope: z.array(z.string()).default([]),
  labour: z.array(z.record(z.unknown())).default([]),
  quantities: z.array(z.record(z.unknown())).default([]),
  pricing: z.array(z.record(z.unknown())).default([]),
  customerRequirements: z.array(z.string()).default([]),
  assumptions: z.array(z.string()).default([]),
  missingInformation: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1),
  sources: z.array(SourceRefSchema).default([]),
});

export type ExtractedProjectData = z.infer<typeof ExtractedProjectDataSchema>;
