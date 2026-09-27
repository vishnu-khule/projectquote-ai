import { z } from "zod";

export const CreateCatalogItemSchema = z.object({
  sku: z.string().min(1).max(60),
  name: z.string().min(1).max(200),
  category: z.string().min(1).max(80),
  unit: z.string().min(1).max(20),
  unitPrice: z.string().regex(/^\d+(\.\d+)?$/),
  taxPercent: z.string().regex(/^\d+(\.\d+)?$/).optional().default("18"),
});

export type CreateCatalogItemBody = z.infer<typeof CreateCatalogItemSchema>;
