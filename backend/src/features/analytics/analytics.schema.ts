import { z } from "zod";

export const analyticsEventSchema = z.object({
  type: z.enum(["pageview", "click", "error", "session_start", "session_end"]),
  path: z.string().max(500).optional(),
  targetId: z.string().max(200).optional(),
  message: z.string().max(2000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string().datetime().optional(),
});

export const ingestSchema = z.object({
  sessionId: z.string().uuid(),
  visitorId: z.string().min(8).max(100),
  isReturning: z.boolean().optional(),
  referrer: z.string().max(500).optional(),
  entryPath: z.string().max(500).optional(),
  exitPath: z.string().max(500).optional(),
  durationSeconds: z.number().int().min(0).max(86400).optional(),
  events: z.array(analyticsEventSchema).min(1).max(50),
});

export type IngestPayload = z.infer<typeof ingestSchema>;
