import { z } from "zod";

export const applyReferralSchema = z.object({
  code: z.string().trim().min(1, "Code de parrainage requis").max(50),
  email: z.string().trim().toLowerCase().email("Email invalide"),
});

export type ApplyReferralInput = z.infer<typeof applyReferralSchema>;

/** Palier minimum pour déclencher le crédit parrain (FCFA). */
export const REFERRAL_MIN_ORDER_AMOUNT = 5_000;

export const STATUS_THRESHOLDS = {
  nouvo:       { min: 0, max: 0 },
  kpata:       { min: 1, max: 4 },
  boss:        { min: 5, max: 14 },
  grand_choco: { min: 15, max: Infinity },
} as const;

export type ReferralLevel = keyof typeof STATUS_THRESHOLDS;

/**
 * Calcule le crédit parrain sur la première commande d'un filleul.
 * Crédit = max(0, commission DJASSA (5%) − frais GeniusPay (1% + 100 F)).
 * DJASSA ne sort jamais de cash — seul le surplus après frais est crédité.
 */
export function computeReferralCredit(orderAmount: number): number {
  const commission = Math.round(orderAmount * 0.05);
  const geniusPayFees = Math.round(orderAmount * 0.01) + 100;
  return Math.max(0, commission - geniusPayFees);
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
