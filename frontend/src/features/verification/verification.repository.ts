import { prisma } from "../../shared/db/client.js";

export class VerificationRepository {
  findByUserId(userId: string) {
    return prisma.user.findUnique({ where: { id: userId }, select: { id: true, sellerVerificationStatus: true, sellerVerificationRectoUrl: true, sellerVerificationVersoUrl: true, sellerVerificationSelfieUrl: true, sellerVerificationReason: true } });
  }

  submit(userId: string, urls: { rectoUrl: string; versoUrl: string; selfieUrl: string }) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        sellerVerificationStatus: "en_attente",
        sellerVerificationRectoUrl: urls.rectoUrl,
        sellerVerificationVersoUrl: urls.versoUrl,
        sellerVerificationSelfieUrl: urls.selfieUrl,
        sellerVerificationReason: null,
      },
      select: { id: true, sellerVerificationStatus: true },
    });
  }

  listPending() {
    return prisma.user.findMany({
      where: { sellerVerificationStatus: "en_attente", accountType: "vendeur" },
      select: { id: true, email: true, sellerVerificationRectoUrl: true, sellerVerificationVersoUrl: true, sellerVerificationSelfieUrl: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });
  }

  approve(userId: string) {
    return prisma.user.update({ where: { id: userId }, data: { sellerVerificationStatus: "approuvee", sellerVerificationReason: null }, select: { id: true } });
  }

  reject(userId: string, reason: string) {
    return prisma.user.update({ where: { id: userId }, data: { sellerVerificationStatus: "rejetee", sellerVerificationReason: reason }, select: { id: true } });
  }
}
