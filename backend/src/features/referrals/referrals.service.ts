import crypto from "node:crypto";
import { ReferralRepository } from "./referrals.repository.js";
import { UserRepository } from "../users/user.repository.js";
import {
  computeAffiliateReward,
  getReferralLevel,
  getNextThreshold,
  isWithinVendorWindow,
  validateWithdrawal,
  REFERRAL_MIN_ORDER_AMOUNT,
  type WithdrawalMethod,
} from "./referrals.schema.js";
import { NotFoundError, ConflictError, ValidationError } from "../../shared/errors/index.js";
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
    const wallet = await referralRepo.getWalletSummary(userId);
    const referrals = await referralRepo.findByReferrerId(userId);
    const code = await userRepo.findReferralCode(userId);

    return {
      code,
      totalReferrals,
      conversions,
      rewardedConversions,
      totalEarnings: wallet.totalEarned,
      walletBalance: wallet.balance,
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
   * Parrainage ACHETEUR : appelé quand un filleul confirme sa première commande.
   * Crédite le parrain (70% de la marge nette) si la commande >= seuil minimum.
   */
  async tryRewardReferrer(buyerId: string, orderId: string, orderAmount: number) {
    if (orderAmount < REFERRAL_MIN_ORDER_AMOUNT) {
      logger.info({ buyerId, orderAmount }, "Commande sous le seuil parrainage — ignorée");
      return;
    }

    const ref = await referralRepo.findEligibleForReward(buyerId);
    if (!ref) return;

    const amount = computeAffiliateReward(orderAmount);
    const credited = await referralRepo.creditBuyerReferral(
      { id: ref.id, referrerId: ref.referrerId },
      orderId,
      amount,
    );
    if (credited) {
      logger.info({ referrerId: ref.referrerId, buyerId, orderId, amount }, "Parrain acheteur crédité");
    }
  },

  /**
   * Parrainage VENDEUR : appelé à chaque vente confirmée d'un vendeur.
   * Si ce vendeur a été parrainé, le parrain touche 70% de la marge nette sur
   * chaque vente pendant 30 jours à partir de sa première vente.
   */
  async tryRewardVendorReferrer(vendorId: string, orderId: string, orderAmount: number, saleDate: Date) {
    const ref = await referralRepo.findReferredUser(vendorId);
    if (!ref) return;

    const windowStart = ref.vendorWindowStartsAt;
    if (windowStart && !isWithinVendorWindow(windowStart, saleDate)) {
      return; // fenêtre de 30 jours expirée
    }

    const amount = computeAffiliateReward(orderAmount);
    const credited = await referralRepo.creditVendorSale({
      referralId: ref.id,
      referrerId: ref.referrerId,
      orderId,
      amount,
      saleDate,
      setWindowStart: !windowStart,
    });
    if (credited) {
      logger.info({ referrerId: ref.referrerId, vendorId, orderId, amount }, "Parrain vendeur crédité");
    }
  },

  /** Résumé de la cagnotte du membre connecté. */
  async getWallet(userId: string) {
    return referralRepo.getWalletSummary(userId);
  },

  /** Crée une demande de retrait Mobile Money (débite la cagnotte). */
  async requestWithdrawal(
    userId: string,
    input: { amount: number; method: WithdrawalMethod; phone: string },
  ) {
    const { balance } = await referralRepo.getWalletSummary(userId);
    const check = validateWithdrawal(balance, input.amount);
    if (!check.ok) throw new ValidationError({ amount: check.error });

    const withdrawal = await referralRepo.createWithdrawal(
      userId,
      input.amount,
      input.method,
      input.phone,
    );
    if (!withdrawal) throw new ValidationError({ amount: "Solde insuffisant" });

    logger.info({ userId, amount: input.amount, method: input.method }, "Demande de retrait créée");
    return withdrawal;
  },

  /** Historique des retraits du membre connecté. */
  async listWithdrawals(userId: string) {
    return referralRepo.listWithdrawals(userId);
  },

  /** Admin : marque un retrait payé ou rejeté (recrédite la cagnotte si rejeté). */
  async adminSetWithdrawalStatus(withdrawalId: string, status: "paid" | "rejected") {
    return referralRepo.setWithdrawalStatus(withdrawalId, status);
  },

  /** Classement public. */
  async getLeaderboard() {
    return { leaderboard: await referralRepo.getLeaderboard(20) };
  },
};
