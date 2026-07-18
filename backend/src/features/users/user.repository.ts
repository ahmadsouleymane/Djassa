import { prisma } from "../../shared/db/client.js";
import type { User, AccountType, Prisma, SellerVerificationStatus } from "@prisma/client";

export class UserRepository {
  create(data: {
    email: string;
    phone: string;
    passwordHash: string;
    accountType: AccountType;
  }): Promise<User> {
    return prisma.user.create({ data });
  }

  findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return prisma.user.update({ where: { id }, data });
  }

  findByVerificationStatus(status: SellerVerificationStatus): Promise<User[]> {
    return prisma.user.findMany({ where: { sellerVerificationStatus: status } });
  }

  findPublicVendor(id: string) {
    return prisma.user.findFirst({
      where: { id, accountType: "vendeur", sellerVerificationStatus: "approuvee" },
      select: { id: true, createdAt: true, sellerVerificationStatus: true, planTier: true },
    });
  }
}
