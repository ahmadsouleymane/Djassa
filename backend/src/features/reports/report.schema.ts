import { z } from "zod";

export const createReportSchema = z.object({
  targetType: z.enum(["produit", "utilisateur", "message"]),
  targetId: z.string().min(1).max(100),
  reason: z.string().min(10).max(1000),
});

export const resolveReportSchema = z.object({
  status: z.enum(["traite", "rejete"]),
  adminNote: z.string().max(1000).optional(),
});
