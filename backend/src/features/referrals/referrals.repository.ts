import { prisma } from "../../shared/db/client.js";
import type { Referral, ReferralStatus, RewardStatus } from "@prisma/client";

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
}
