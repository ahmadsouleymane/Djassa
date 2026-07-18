import { prisma } from "../../shared/db/client.js";
import type { PasswordResetToken } from "@prisma/client";

export class PasswordResetRepository {
  create(userId: string, tokenHash: string, expiresAt: Date): Promise<PasswordResetToken> {
    return prisma.passwordResetToken.create({ data: { userId, tokenHash, expiresAt } });
  }

  findValidByHash(tokenHash: string): Promise<PasswordResetToken | null> {
    return prisma.passwordResetToken.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
    });
  }

  markUsed(id: string): Promise<PasswordResetToken> {
    return prisma.passwordResetToken.update({ where: { id }, data: { usedAt: new Date() } });
  }

  invalidateAllForUser(userId: string) {
    return prisma.passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });
  }
}
