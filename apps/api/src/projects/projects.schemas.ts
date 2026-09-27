import { ProjectStatusSchema } from "@projectquote/schemas";
import { z } from "zod";

export const CreateProjectBodySchema = z.object({
  title: z.string().min(1).max(200),
  projectType: z.string().min(1).max(80),
  projectDescription: z.string().max(5000).optional(),
  location: z.string().max(200).optional(),
  customerName: z.string().min(1).max(120).optional(),
});

export const UpdateProjectBodySchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    projectDescription: z.string().max(5000).optional(),
    location: z.string().max(200).optional(),
    requirements: z.record(z.unknown()).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field required",
  });

export const TransitionProjectStatusBodySchema = z.object({
  status: ProjectStatusSchema,
});

export type CreateProjectBody = z.infer<typeof CreateProjectBodySchema>;
export type UpdateProjectBody = z.infer<typeof UpdateProjectBodySchema>;
export type TransitionProjectStatusBody = z.infer<
  typeof TransitionProjectStatusBodySchema
>;
