import { PriceSourceSchema } from "@projectquote/schemas";
import { z } from "zod";

const moneyField = z.string().regex(/^\d+(\.\d+)?$/);

export const LineItemInputSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  category: z.string().min(1).max(80),
  quantity: moneyField,
  unit: z.string().min(1).max(20),
  unitPrice: moneyField,
  labourHours: moneyField.optional(),
  labourRate: moneyField.optional(),
  discountPercent: moneyField.optional().default("0"),
  taxPercent: moneyField.optional().default("18"),
  priceSource: PriceSourceSchema.default("user"),
  confirmed: z.boolean().optional(),
});

export const ReplaceLineItemsBodySchema = z.object({
  lineItems: z.array(LineItemInputSchema).min(1),
});

export const CreateLineItemBodySchema = LineItemInputSchema;

export const UpdateLineItemBodySchema = LineItemInputSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field required" },
);

export type LineItemInput = z.infer<typeof LineItemInputSchema>;
export type CreateLineItemBody = z.infer<typeof CreateLineItemBodySchema>;
export type ReplaceLineItemsBody = z.infer<typeof ReplaceLineItemsBodySchema>;
export type UpdateLineItemBody = z.infer<typeof UpdateLineItemBodySchema>;
