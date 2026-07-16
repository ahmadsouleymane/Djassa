import { z } from "zod";

export const submitVerificationSchema = z.object({
  documentUrl: z.string().url(),
});

export const rejectVerificationSchema = z.object({
  reason: z.string().min(5).max(500),
});
