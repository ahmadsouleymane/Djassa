import { z } from "zod";

export const startConversationSchema = z.object({
  productId: z.string().uuid(),
});

export const sendMessageSchema = z.object({
  text: z.string().min(1).max(2000),
  offerPrice: z.number().int().positive().optional(),
});

export type StartConversationInput = z.infer<typeof startConversationSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
