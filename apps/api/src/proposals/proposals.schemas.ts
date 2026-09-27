import { z } from "zod";

export const UpdateProposalSectionBodySchema = z.object({
  content: z.string().min(1).max(20000),
});

export type UpdateProposalSectionBody = z.infer<
  typeof UpdateProposalSectionBodySchema
>;
