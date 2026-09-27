import { z } from "zod";
import { SourceRefSchema } from "./common.js";

export const ProjectStatusSchema = z.enum([
  "DRAFT",
  "DOCUMENT_PROCESSING",
  "ANALYZING",
  "WAITING_FOR_INFORMATION",
  "READY_FOR_ESTIMATION",
  "ESTIMATION_GENERATED",
  "VALIDATION",
  "PROPOSALS_GENERATED",
  "USER_REVIEW",
  "APPROVED",
  "PDF_GENERATED",
  "SHARED",
  "DOCUMENT_PROCESSING_FAILED",
  "AI_ANALYSIS_FAILED",
  "VALIDATION_FAILED",
  "PDF_GENERATION_FAILED",
]);

export const DimensionsSchema = z.object({
  length: z.number().positive().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  unit: z.enum(["ft", "m", "in", "cm"]).default("ft"),
  sources: z.array(SourceRefSchema).default([]),
});

export const CustomerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().length(2).optional(),
});

export const ProjectRequirementSchema = z.object({
  key: z.string(),
  label: z.string(),
  value: z.unknown(),
  required: z.boolean(),
  status: z.enum(["confirmed", "assumed", "missing", "conflicting"]),
  sources: z.array(SourceRefSchema).default([]),
});

export const ProjectSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  customerId: z.string().uuid().optional(),
  customer: CustomerSchema.optional(),
  projectType: z.string(),
  title: z.string().min(1),
  projectDescription: z.string().optional(),
  location: z.string().optional(),
  dimensions: DimensionsSchema.optional(),
  requirements: z.array(ProjectRequirementSchema).default([]),
  scope: z.array(z.string()).default([]),
  assumptions: z.array(z.string()).default([]),
  exclusions: z.array(z.string()).default([]),
  timeline: z.string().optional(),
  paymentTerms: z.string().optional(),
  warranty: z.string().optional(),
  status: ProjectStatusSchema,
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

export type Project = z.infer<typeof ProjectSchema>;
export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;
