import { z } from "zod";

export const submitSchema = z.object({
  rectoUrl: z.string().url(),
  versoUrl: z.string().url(),
  selfieUrl: z.string().url(),
});

export const rejectSchema = z.object({
  reason: z.string().min(10, "Le motif doit faire au moins 10 caractères").max(500),
});
