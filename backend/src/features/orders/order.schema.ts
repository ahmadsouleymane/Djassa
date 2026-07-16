import { z } from "zod";

export const createOrderSchema = z.object({
  chatMessageId: z.string().uuid(),
});

export const disputeSchema = z.object({
  reason: z.string().min(10).max(1000),
});

export const resolveDisputeSchema = z.object({
  resolution: z.enum(["confirme", "rembourse"]),
});
