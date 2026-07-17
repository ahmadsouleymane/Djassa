import { z } from "zod";

export const createOrderSchema = z.object({
  chatMessageId: z.string().uuid(),
});

export const createDirectOrderSchema = z.object({
  productIds: z.array(z.string().uuid()).min(1),
});

export const disputeSchema = z.object({
  reason: z.string().min(10).max(1000),
});

export const resolveDisputeSchema = z.object({
  resolution: z.enum(["confirme", "rembourse"]),
});
