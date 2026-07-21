import { WaitlistRepository } from "./waitlist.repository.js";
import { ConflictError } from "../../shared/errors/index.js";
import { sendEmail, waitlistConfirmationEmailHtml } from "../../shared/email/index.js";
import type { createWaitlistSignupSchema } from "./waitlist.schema.js";
import type { z } from "zod";

const waitlistRepo = new WaitlistRepository();

export const WaitlistService = {
  async create(input: z.infer<typeof createWaitlistSignupSchema>) {
    const existing = await waitlistRepo.findByEmail(input.email);
    if (existing) throw new ConflictError("Cet email est déjà inscrit sur la liste d'attente");

    const signup = await waitlistRepo.create(input);

    // Email de confirmation (fire-and-forget)
    sendEmail(
      input.email,
      "Bienvenue sur la liste d'attente Djassa",
      waitlistConfirmationEmailHtml({ email: input.email }),
    );

    return signup;
  },

  count() {
    return waitlistRepo.count();
  },

  list() {
    return waitlistRepo.findMany();
  },
};
