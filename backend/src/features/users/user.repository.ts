import { prisma } from "../../shared/db/client.js";
import type { User, AccountType, Prisma, SellerVerificationStatus } from "@prisma/client";

export class UserRepository {
  create(data: {
    email: string;
    phone: string;
    passwordHash: string;
    accountType: AccountType;
    planTier?: "pro" | "standard";
    planPeriodEnd?: Date;
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
      select: {
        id: true,
        createdAt: true,
        sellerVerificationStatus: true,
        planTier: true,
        storeName: true,
        storeDescription: true,
        storeLogoUrl: true,
        storeBannerUrl: true,
      },
    });
  }

  countByAccountType() {
    return prisma.user.groupBy({ by: ["accountType"], _count: { _all: true } });
  }

  countByVerificationStatus() {
    return prisma.user.groupBy({ by: ["sellerVerificationStatus"], _count: { _all: true } });
  }

  countSince(since: Date): Promise<number> {
    return prisma.user.count({ where: { createdAt: { gte: since } } });
  }

  async emailsByAccountType(accountType?: AccountType): Promise<string[]> {
    const users = await prisma.user.findMany({
      where: accountType ? { accountType } : undefined,
      select: { email: true },
    });
    return users.map((u) => u.email);
  }

  /** Récupère uniquement le code de parrainage d'un utilisateur. */
  async findReferralCode(userId: string): Promise<string | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    });
    return user?.referralCode ?? null;
  }
}
