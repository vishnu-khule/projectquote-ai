import { z } from "zod";

const taxField = z.string().regex(/^\d+(\.\d+)?$/);

export const UpdateOrganizationSettingsSchema = z.object({
  defaultTaxPercent: taxField,
});

export type UpdateOrganizationSettingsBody = z.infer<
  typeof UpdateOrganizationSettingsSchema
>;
