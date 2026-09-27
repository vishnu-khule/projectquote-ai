import { z } from "zod";

export const ProposalSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  order: z.number().int(),
});

export const ProposalSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  estimateId: z.string().uuid(),
  version: z.number().int().positive(),
  tier: z.enum(["basic", "modern", "premium", "single"]),
  title: z.string(),
  sections: z.array(ProposalSectionSchema),
  status: z.enum(["draft", "review", "approved", "pdf_ready", "shared"]),
  approvedAt: z.string().datetime({ offset: true }).optional(),
  approvedByUserId: z.string().uuid().optional(),
  createdAt: z.string().datetime({ offset: true }),
});

export const ProposalTierPackageSchema = z.object({
  tier: z.enum(["basic", "modern", "premium"]),
  scopeSummary: z.string(),
  materialsSummary: z.string(),
  features: z.array(z.string()),
  timeline: z.string(),
  warranty: z.string(),
  assumptions: z.array(z.string()),
  exclusions: z.array(z.string()),
  estimateId: z.string().uuid(),
});

export type Proposal = z.infer<typeof ProposalSchema>;
export type ProposalSection = z.infer<typeof ProposalSectionSchema>;
