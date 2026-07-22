import { z } from "zod";

export const applyReferralSchema = z.object({
  code: z.string().trim().min(1, "Code de parrainage requis").max(50),
  email: z.string().trim().toLowerCase().email("Email invalide"),
});

export type ApplyReferralInput = z.infer<typeof applyReferralSchema>;

/** Palier minimum de commande pour déclencher le crédit d'un parrainage ACHETEUR (FCFA). */
export const REFERRAL_MIN_ORDER_AMOUNT = 5_000;

/** Part de la marge nette DJASSA reversée au parrain (le reste est gardé par DJASSA). */
export const AFFILIATE_MARGIN_SHARE = 0.7;

/** Durée (en jours) pendant laquelle un parrain touche sur les ventes d'un vendeur parrainé. */
export const VENDOR_AFFILIATE_WINDOW_DAYS = 30;

/** Montant minimum d'un retrait de cagnotte (FCFA). */
export const MIN_WITHDRAWAL_AMOUNT = 500;

export const WITHDRAWAL_METHODS = ["wave", "orange_money", "mtn"] as const;
export type WithdrawalMethod = (typeof WITHDRAWAL_METHODS)[number];

export const createWithdrawalSchema = z.object({
  amount: z.number().int("Montant invalide").positive("Montant invalide"),
  method: z.enum(WITHDRAWAL_METHODS),
  phone: z.string().trim().regex(/^0\d{9}$/, "Le numéro doit commencer par 0 et faire 10 chiffres"),
});

export type CreateWithdrawalInput = z.infer<typeof createWithdrawalSchema>;

export const STATUS_THRESHOLDS = {
  nouvo:       { min: 0, max: 0 },
  kpata:       { min: 1, max: 4 },
  boss:        { min: 5, max: 14 },
  grand_choco: { min: 15, max: Infinity },
} as const;

export type ReferralLevel = keyof typeof STATUS_THRESHOLDS;

/**
 * Marge nette DJASSA sur une vente : commission (5%) − frais opérateur (1% + 100 F fixes).
 * Peut être négative sur les toutes petites ventes (les 100 F fixes dominent).
 */
export function computeNetMargin(orderAmount: number): number {
  const commission = Math.round(orderAmount * 0.05);
  const geniusPayFees = Math.round(orderAmount * 0.01) + 100;
  return commission - geniusPayFees;
}

/**
 * Récompense d'affiliation = 70% de la marge nette DJASSA, jamais négative.
 * Comme c'est une fraction d'une marge déjà positive, DJASSA ne peut jamais perdre d'argent.
 * Utilisée à l'identique pour le parrainage acheteur (1er achat) et vendeur (chaque vente).
 */
export function computeAffiliateReward(orderAmount: number): number {
  return Math.max(0, Math.round(computeNetMargin(orderAmount) * AFFILIATE_MARGIN_SHARE));
}

/** Alias rétro-compatible (ancien nom utilisé pour le parrainage acheteur). */
export const computeReferralCredit = computeAffiliateReward;

/**
 * Une vente d'un vendeur parrainé est-elle éligible ? Elle doit tomber dans la
 * fenêtre [première vente ; première vente + 30 jours].
 */
export function isWithinVendorWindow(
  windowStart: Date,
  saleDate: Date,
  windowDays = VENDOR_AFFILIATE_WINDOW_DAYS,
): boolean {
  const start = windowStart.getTime();
  const end = start + windowDays * 24 * 60 * 60 * 1000;
  const t = saleDate.getTime();
  return t >= start && t <= end;
}

export type WithdrawalValidation = { ok: true } | { ok: false; error: string };

/** Valide une demande de retrait contre le solde de cagnotte disponible. */
export function validateWithdrawal(balance: number, amount: number): WithdrawalValidation {
  if (!Number.isInteger(amount) || amount <= 0) return { ok: false, error: "Montant invalide" };
  if (amount < MIN_WITHDRAWAL_AMOUNT)
    return { ok: false, error: `Le retrait minimum est de ${MIN_WITHDRAWAL_AMOUNT} FCFA` };
  if (amount > balance) return { ok: false, error: "Solde insuffisant" };
  return { ok: true };
}

export function getReferralLevel(conversions: number): ReferralLevel {
  if (conversions === 0) return "nouvo";
  if (conversions <= 4) return "kpata";
  if (conversions <= 14) return "boss";
  return "grand_choco";
}

export function getNextThreshold(conversions: number): { nextLevel: ReferralLevel; needed: number } | null {
  const levels: { level: ReferralLevel; min: number }[] = [
    { level: "kpata", min: 1 },
    { level: "boss", min: 5 },
    { level: "grand_choco", min: 15 },
  ];
  for (const { level, min } of levels) {
    if (conversions < min) return { nextLevel: level, needed: min - conversions };
  }
  return null;
}
