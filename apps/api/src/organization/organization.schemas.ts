import { z } from "zod";

const taxField = z.string().regex(/^\d+(\.\d+)?$/);

export const UpdateOrganizationSettingsSchema = z.object({
  defaultTaxPercent: taxField,
});

export type UpdateOrganizationSettingsBody = z.infer<
  typeof UpdateOrganizationSettingsSchema
>;

export const CreateInviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["MEMBER", "ADMIN"]).optional().default("MEMBER"),
});

export const AcceptInviteSchema = z.object({
  token: z.string().min(16),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(120).optional(),
});

export type CreateInviteBody = z.infer<typeof CreateInviteSchema>;
export type AcceptInviteBody = z.infer<typeof AcceptInviteSchema>;
