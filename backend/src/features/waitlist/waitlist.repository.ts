import { prisma } from "../../shared/db/client.js";
import type { WaitlistSignup } from "@prisma/client";

type CreateInput = {
  firstName: string;
  lastName: string;
  email: string;
};

export class WaitlistRepository {
  create(data: CreateInput): Promise<WaitlistSignup> {
    return prisma.waitlistSignup.create({ data });
  }

  findByEmail(email: string): Promise<WaitlistSignup | null> {
    return prisma.waitlistSignup.findUnique({ where: { email } });
  }

  count(): Promise<number> {
    return prisma.waitlistSignup.count();
  }
}
