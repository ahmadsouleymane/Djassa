import { prisma } from "../../shared/db/client.js";
import type { User, AccountType } from "@prisma/client";

export class UserRepository {
  create(data: { email: string; passwordHash: string; accountType: AccountType }): Promise<User> {
    return prisma.user.create({ data });
  }

  findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }
}
