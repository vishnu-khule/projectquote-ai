import { z } from "zod";

export const ChatMessageBodySchema = z.object({
  message: z.string().min(1).max(8000),
  stream: z.boolean().optional().default(false),
});

export type ChatMessageBody = z.infer<typeof ChatMessageBodySchema>;
