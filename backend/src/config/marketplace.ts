export const MARKETPLACE_COMMISSION_RATE = { standard: 0.05, pro: 0.03 } as const;
export const MARKETPLACE_SHIP_DEADLINE_HOURS = 72;
export const MARKETPLACE_CONFIRM_DEADLINE_DAYS = 7;

export function computeCommission(price: number, tier: "standard" | "pro") {
  const rate = MARKETPLACE_COMMISSION_RATE[tier];
  const commissionAmount = Math.round(price * rate);
  return { commissionAmount, netAmount: price - commissionAmount };
}

/** Prix unitaire après application de la promo automatique du vendeur (sans code). */
export function effectiveUnitPrice(price: number, discountPercent?: number | null): number {
  if (!discountPercent || discountPercent <= 0) return price;
  const capped = Math.min(90, discountPercent);
  return Math.max(1, Math.round(price * (1 - capped / 100)));
}
