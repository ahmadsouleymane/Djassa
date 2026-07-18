import { z } from "zod";

export const sendAdminEmailSchema = z.object({
  recipientFilter: z.enum(["all", "vendeurs", "clients", "custom"]),
  customEmail: z.string().email().optional(),
  subject: z.string().min(3).max(200),
  body: z.string().min(10).max(20000),
});

export type SendAdminEmailInput = z.infer<typeof sendAdminEmailSchema>;
