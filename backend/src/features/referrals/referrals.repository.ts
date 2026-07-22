import { prisma } from "../../shared/db/client.js";
import type { Referral, ReferralStatus, Withdrawal, WithdrawalMethod, WithdrawalStatus } from "@prisma/client";

type CreateInput = {
  referrerId: string;
  referredEmail: string;
  status?: ReferralStatus;
};

export class ReferralRepository {
  create(data: CreateInput): Promise<Referral> {
    return prisma.referral.create({ data });
  }

  findByReferralCode(code: string) {
    return prisma.user.findUnique({
      where: { referralCode: code },
      select: { id: true, email: true, storeName: true, referralCode: true },
    });
  }

  findByReferredEmail(email: string): Promise<Referral | null> {
    return prisma.referral.findFirst({ where: { referredEmail: email } });
  }

  findByReferrerId(referrerId: string): Promise<Referral[]> {
    return prisma.referral.findMany({
      where: { referrerId },
      orderBy: { createdAt: "desc" },
    });
  }

  countByReferrer(referrerId: string): Promise<number> {
    return prisma.referral.count({ where: { referrerId } });
  }

  countConvertedByReferrer(referrerId: string): Promise<number> {
    return prisma.referral.count({
      where: { referrerId, status: "purchased" },
    });
  }

  countRewardedByReferrer(referrerId: string): Promise<number> {
    return prisma.referral.count({
      where: { referrerId, rewardStatus: "credited" },
    });
  }

  sumRewardsByReferrer(referrerId: string): Promise<number> {
    return prisma.referral
      .aggregate({
        where: { referrerId, rewardStatus: "credited" },
        _sum: { rewardAmount: true },
      })
      .then((r) => r._sum.rewardAmount ?? 0);
  }

  async findPendingReferralsByEmail(email: string): Promise<Referral[]> {
    return prisma.referral.findMany({
      where: { referredEmail: email, status: "pending" },
    });
  }

  updateStatus(id: string, status: ReferralStatus): Promise<Referral> {
    return prisma.referral.update({ where: { id }, data: { status } });
  }

  setReferredUser(id: string, referredUserId: string): Promise<Referral> {
    return prisma.referral.update({
      where: { id },
      data: { referredUserId, status: "signed_up" },
    });
  }

  creditReward(id: string, amount: number): Promise<Referral> {
    return prisma.referral.update({
      where: { id },
      data: { rewardStatus: "credited", rewardAmount: amount },
    });
  }

  /**
   * Crédite le parrain de façon atomique : met à jour status + rewardStatus + rewardAmount
   * en une seule requête avec un WHERE conditionnel qui empêche les race conditions.
   * Retourne le nombre de lignes affectées (0 si déjà crédité par un appel concurrent).
   */
  creditReferral(id: string, credit: number) {
    return prisma.referral.updateMany({
      where: { id, status: "signed_up", rewardStatus: "pending" },
      data: { status: "purchased", rewardStatus: "credited", rewardAmount: credit },
    });
  }

  findByReferredUserId(referredUserId: string): Promise<Referral | null> {
    return prisma.referral.findFirst({
      where: { referredUserId, status: "signed_up" },
    });
  }

  async getLeaderboard(limit = 20) {
    const groups = await prisma.referral.groupBy({
      by: ["referrerId"],
      where: { rewardStatus: "credited" },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: limit,
    });
    const referrerIds = groups.map((g) => g.referrerId);
    const users = await prisma.user.findMany({
      where: { id: { in: referrerIds } },
      select: { id: true, storeName: true, email: true, createdAt: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));
    return groups.map((g, i) => ({
      rank: i + 1,
      referrerName:
        userMap.get(g.referrerId)?.storeName ??
        userMap.get(g.referrerId)?.email?.split("@")[0] ??
        "Anonyme",
      count: g._count.id,
    }));
  }

  /** Trouve le referral pour créditer quand le filleul fait son premier achat éligible. */
  findEligibleForReward(referredUserId: string): Promise<Referral | null> {
    return prisma.referral.findFirst({
      where: {
        referredUserId,
        status: "signed_up",
        rewardStatus: "pending",
      },
    });
  }

  /** Trouve le parrainage d'un utilisateur (peu importe le statut) — utilisé pour l'affiliation vendeur. */
  findReferredUser(referredUserId: string): Promise<Referral | null> {
    return prisma.referral.findFirst({ where: { referredUserId } });
  }

  /**
   * Crédite le parrain pour le PREMIER achat d'un filleul acheteur, de façon atomique :
   * - flip conditionnel du referral (anti-race)
   * - création d'une ligne ReferralReward (idempotence via unique [orderId, kind])
   * - incrément de la cagnotte du parrain
   * Retourne true si le crédit a bien eu lieu, false si déjà fait.
   */
  async creditBuyerReferral(
    referral: { id: string; referrerId: string },
    orderId: string,
    amount: number,
  ): Promise<boolean> {
    return prisma.$transaction(async (tx) => {
      const flip = await tx.referral.updateMany({
        where: { id: referral.id, status: "signed_up", rewardStatus: "pending" },
        data: { status: "purchased", rewardStatus: "credited", rewardAmount: amount },
      });
      if (flip.count === 0) return false; // déjà crédité par un appel concurrent
      if (amount > 0) {
        await tx.referralReward.create({
          data: {
            referralId: referral.id,
            referrerId: referral.referrerId,
            orderId,
            amount,
            kind: "buyer_first_purchase",
          },
        });
        await tx.user.update({
          where: { id: referral.referrerId },
          data: { walletBalance: { increment: amount } },
        });
      }
      return true;
    });
  }

  /**
   * Crédite le parrain sur une vente d'un vendeur parrainé (fenêtre de 30 jours).
   * Démarre la fenêtre à la 1re vente, idempotent par [orderId, vendor_sale],
   * incrémente la cagnotte. Le service a déjà vérifié que la vente est dans la fenêtre.
   */
  async creditVendorSale(params: {
    referralId: string;
    referrerId: string;
    orderId: string;
    amount: number;
    saleDate: Date;
    setWindowStart: boolean;
  }): Promise<boolean> {
    return prisma.$transaction(async (tx) => {
      if (params.setWindowStart) {
        await tx.referral.update({
          where: { id: params.referralId },
          data: { vendorWindowStartsAt: params.saleDate },
        });
      }
      if (params.amount <= 0) return false;
      const exists = await tx.referralReward.findUnique({
        where: { orderId_kind: { orderId: params.orderId, kind: "vendor_sale" } },
      });
      if (exists) return false; // déjà crédité pour cette commande
      await tx.referralReward.create({
        data: {
          referralId: params.referralId,
          referrerId: params.referrerId,
          orderId: params.orderId,
          amount: params.amount,
          kind: "vendor_sale",
        },
      });
      await tx.user.update({
        where: { id: params.referrerId },
        data: { walletBalance: { increment: params.amount } },
      });
      return true;
    });
  }

  /** Solde de cagnotte + total gagné (brut, sur toute la vie du compte). */
  async getWalletSummary(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true },
    });
    const earned = await prisma.referralReward.aggregate({
      where: { referrerId: userId },
      _sum: { amount: true },
    });
    return {
      balance: user?.walletBalance ?? 0,
      totalEarned: earned._sum.amount ?? 0,
    };
  }

  /**
   * Crée une demande de retrait ET débite la cagnotte de façon atomique.
   * Le débit est conditionné à un solde suffisant (anti-race / anti double-dépense).
   * Retourne la demande créée, ou null si solde insuffisant au moment du débit.
   */
  async createWithdrawal(
    userId: string,
    amount: number,
    method: WithdrawalMethod,
    phone: string,
  ): Promise<Withdrawal | null> {
    return prisma.$transaction(async (tx) => {
      const debited = await tx.user.updateMany({
        where: { id: userId, walletBalance: { gte: amount } },
        data: { walletBalance: { decrement: amount } },
      });
      if (debited.count === 0) return null; // solde insuffisant
      return tx.withdrawal.create({ data: { userId, amount, method, phone } });
    });
  }

  listWithdrawals(userId: string): Promise<Withdrawal[]> {
    return prisma.withdrawal.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  }

  /**
   * Change le statut d'un retrait (admin). En cas de rejet, on recrédite la cagnotte.
   * Ne fait rien si le retrait n'est plus 'pending' (idempotent).
   */
  async setWithdrawalStatus(
    withdrawalId: string,
    status: Extract<WithdrawalStatus, "paid" | "rejected">,
  ): Promise<Withdrawal | null> {
    return prisma.$transaction(async (tx) => {
      const w = await tx.withdrawal.findUnique({ where: { id: withdrawalId } });
      if (!w || w.status !== "pending") return null;
      if (status === "rejected") {
        await tx.user.update({
          where: { id: w.userId },
          data: { walletBalance: { increment: w.amount } },
        });
      }
      return tx.withdrawal.update({
        where: { id: withdrawalId },
        data: { status, processedAt: new Date() },
      });
    });
  }
}
