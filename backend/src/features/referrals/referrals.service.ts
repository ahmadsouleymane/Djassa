import crypto from "node:crypto";
import { ReferralRepository } from "./referrals.repository.js";
import { UserRepository } from "../users/user.repository.js";
import {
  computeReferralCredit,
  getReferralLevel,
  getNextThreshold,
  REFERRAL_MIN_ORDER_AMOUNT,
} from "./referrals.schema.js";
import { NotFoundError, ConflictError } from "../../shared/errors/index.js";
import { logger } from "../../shared/logger/index.js";

const referralRepo = new ReferralRepository();
const userRepo = new UserRepository();

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[crypto.randomInt(chars.length)];
  }
  return `DJASSA-${code}`;
}

export const ReferralService = {
  /** Récupère ou génère le code de parrainage d'un utilisateur. */
  async getOrCreateCode(userId: string) {
    const user = await userRepo.findById(userId);
    if (!user) throw new NotFoundError("Utilisateur");

    if (!user.referralCode) {
      let code = generateCode();
      while (await referralRepo.findByReferralCode(code)) {
        code = generateCode();
      }
      await userRepo.update(userId, { referralCode: code });
      return { code };
    }

    return { code: user.referralCode };
  },

  /** Stats complètes du parrain connecté. */
  async getMyStats(userId: string) {
    const totalReferrals = await referralRepo.countByReferrer(userId);
    const conversions = await referralRepo.countConvertedByReferrer(userId);
    const rewardedConversions = await referralRepo.countRewardedByReferrer(userId);
    const totalEarnings = await referralRepo.sumRewardsByReferrer(userId);
    const referrals = await referralRepo.findByReferrerId(userId);
    const code = await userRepo.findReferralCode(userId);

    return {
      code,
      totalReferrals,
      conversions,
      rewardedConversions,
      totalEarnings,
      level: getReferralLevel(conversions),
      nextThreshold: getNextThreshold(conversions),
      referrals: referrals.map((r) => ({
        id: r.id,
        email: r.referredEmail,
        status: r.status,
        rewardStatus: r.rewardStatus,
        rewardAmount: r.rewardAmount,
        createdAt: r.createdAt,
      })),
    };
  },

  /** Applique un code de parrainage (avant inscription). */
  async applyCode(input: { code: string; email: string }) {
    const referrer = await referralRepo.findByReferralCode(input.code);
    if (!referrer) throw new NotFoundError("Code de parrainage introuvable");

    const existing = await referralRepo.findByReferredEmail(input.email);
    if (existing) throw new ConflictError("Cet email a déjà été parrainé");

    await referralRepo.create({
      referrerId: referrer.id,
      referredEmail: input.email,
    });

    return { success: true, referrerName: referrer.storeName ?? referrer.email.split("@")[0] };
  },

  /** Vérifie si un code est valide. */
  async checkCode(code: string) {
    const referrer = await referralRepo.findByReferralCode(code);
    if (!referrer) throw new NotFoundError("Code de parrainage introuvable");
    return {
      valid: true as const,
      referrerName: referrer.storeName ?? referrer.email.split("@")[0] ?? "Un membre Djassa",
    };
  },

  /** Appelé après l'inscription : lie le referral à l'utilisateur créé. */
  async onUserRegistered(email: string, userId: string) {
    const pending = await referralRepo.findPendingReferralsByEmail(email);
    for (const ref of pending) {
      await referralRepo.setReferredUser(ref.id, userId);
    }
  },

  /**
   * Appelé quand un utilisateur confirme sa première commande éligible.
   * Crédite le parrain UNIQUEMENT si le montant >= REFERRAL_MIN_ORDER_AMOUNT.
   */
  async tryRewardReferrer(buyerId: string, orderAmount: number) {
    if (orderAmount < REFERRAL_MIN_ORDER_AMOUNT) {
      logger.info({ buyerId, orderAmount }, "Commande sous le seuil parrainage — ignorée");
      return;
    }

    const ref = await referralRepo.findEligibleForReward(buyerId);
    if (!ref) return;

    const credit = computeReferralCredit(orderAmount);
    if (credit <= 0) return;

    const result = await referralRepo.creditReferral(ref.id, credit);
    if (result.count === 0) {
      logger.info({ refId: ref.id, buyerId, credit }, "Parrainage déjà crédité (course condition évitée)");
      return;
    }

    logger.info(
      { referrerId: ref.referrerId, buyerId, orderAmount, credit },
      "Parrain crédité",
    );
  },

  /** Classement public. */
  async getLeaderboard() {
    return { leaderboard: await referralRepo.getLeaderboard(20) };
  },
};
