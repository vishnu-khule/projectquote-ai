import { z } from "zod";

export const RegisterBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(120).optional(),
  organizationName: z.string().min(1).max(120).optional(),
});

export const LoginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
});

export type RegisterBody = z.infer<typeof RegisterBodySchema>;
export type LoginBody = z.infer<typeof LoginBodySchema>;
