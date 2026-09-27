import { z } from "zod";
import { SourceRefSchema } from "./common.js";

export const PriceSourceSchema = z.enum([
  "user",
  "document",
  "catalog",
  "historical",
  "ai_suggestion",
]);

export const EstimateLineItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  category: z.string(),
  description: z.string().optional(),
  quantity: z.string().regex(/^\d+(\.\d+)?$/),
  unit: z.string().min(1),
  unitPrice: z.string().regex(/^\d+(\.\d+)?$/),
  labourHours: z.string().regex(/^\d+(\.\d+)?$/).optional(),
  labourRate: z.string().regex(/^\d+(\.\d+)?$/).optional(),
  discountPercent: z.string().regex(/^\d+(\.\d+)?$/).default("0"),
  taxPercent: z.string().regex(/^\d+(\.\d+)?$/).default("0"),
  priceSource: PriceSourceSchema,
  sources: z.array(SourceRefSchema).default([]),
  confirmed: z.boolean().default(false),
});

export const EstimateTotalsSchema = z.object({
  materialSubtotal: z.string(),
  labourSubtotal: z.string(),
  subtotal: z.string(),
  discountTotal: z.string(),
  taxableAmount: z.string(),
  taxTotal: z.string(),
  grandTotal: z.string(),
  currency: z.string().length(3),
});

export const EstimateSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  version: z.number().int().positive(),
  tier: z.enum(["basic", "modern", "premium", "single"]).default("single"),
  lineItems: z.array(EstimateLineItemSchema),
  totals: EstimateTotalsSchema,
  createdAt: z.string().datetime({ offset: true }),
});

export const ValidationResultSchema = z.object({
  status: z.enum(["PASS", "WARNING", "BLOCKED"]),
  issues: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
  suggestions: z.array(z.string()).default([]),
});

export type EstimateLineItem = z.infer<typeof EstimateLineItemSchema>;
export type Estimate = z.infer<typeof EstimateSchema>;
export type ValidationResult = z.infer<typeof ValidationResultSchema>;
