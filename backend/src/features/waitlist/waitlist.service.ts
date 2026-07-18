import { WaitlistRepository } from "./waitlist.repository.js";
import { ConflictError } from "../../shared/errors/index.js";
import type { createWaitlistSignupSchema } from "./waitlist.schema.js";
import type { z } from "zod";

const waitlistRepo = new WaitlistRepository();

export const WaitlistService = {
  async create(input: z.infer<typeof createWaitlistSignupSchema>) {
    const existing = await waitlistRepo.findByEmail(input.email);
    if (existing) throw new ConflictError("Cet email est déjà inscrit sur la liste d'attente");

    return waitlistRepo.create(input);
  },

  count() {
    return waitlistRepo.count();
  },

  list() {
    return waitlistRepo.findMany();
  },
};
