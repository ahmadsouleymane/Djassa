import { describe, it, expect } from "vitest";
import {
  computeNetMargin,
  computeAffiliateReward,
  computeReferralCredit,
  isWithinVendorWindow,
  validateWithdrawal,
  getReferralLevel,
  getNextThreshold,
  createWithdrawalSchema,
  MIN_WITHDRAWAL_AMOUNT,
  VENDOR_AFFILIATE_WINDOW_DAYS,
  AFFILIATE_MARGIN_SHARE,
} from "./referrals.schema.js";

describe("computeNetMargin", () => {
  it("calcule commission 5% − (1% + 100 F)", () => {
    expect(computeNetMargin(10_000)).toBe(300); // 500 − (100 + 100)
    expect(computeNetMargin(50_000)).toBe(1_900); // 2500 − (500 + 100)
  });

  it("est négative sous ~2 500 F (les 100 F fixes dominent)", () => {
    expect(computeNetMargin(2_000)).toBeLessThan(0);
    expect(computeNetMargin(2_500)).toBe(0); // 125 − (25 + 100)
  });
});

describe("computeAffiliateReward (70% de la marge nette)", () => {
  it("reverse 70% de la marge nette", () => {
    expect(computeAffiliateReward(5_000)).toBe(70); // 70% de 100
    expect(computeAffiliateReward(10_000)).toBe(210); // 70% de 300
    expect(computeAffiliateReward(20_000)).toBe(490); // 70% de 700
    expect(computeAffiliateReward(50_000)).toBe(1_330); // 70% de 1900
  });

  it("ne rend jamais un montant négatif (DJASSA ne perd jamais)", () => {
    expect(computeAffiliateReward(2_000)).toBe(0);
    expect(computeAffiliateReward(0)).toBe(0);
    expect(computeAffiliateReward(1_000)).toBe(0);
  });

  it("laisse toujours une marge positive à DJASSA quand la vente est rentable", () => {
    for (const amount of [5_000, 10_000, 20_000, 50_000, 100_000]) {
      const margin = computeNetMargin(amount);
      const reward = computeAffiliateReward(amount);
      expect(reward).toBeLessThan(margin); // DJASSA garde toujours sa part (30%)
      expect(margin - reward).toBeGreaterThan(0);
    }
  });

  it("computeReferralCredit est un alias de computeAffiliateReward", () => {
    expect(computeReferralCredit).toBe(computeAffiliateReward);
    expect(computeReferralCredit(10_000)).toBe(210);
  });

  it("la part reversée correspond bien à la constante", () => {
    expect(AFFILIATE_MARGIN_SHARE).toBe(0.7);
  });
});

describe("isWithinVendorWindow", () => {
  const start = new Date("2026-01-01T00:00:00Z");

  it("accepte le jour de la première vente", () => {
    expect(isWithinVendorWindow(start, start)).toBe(true);
  });

  it("accepte une vente dans les 30 jours", () => {
    const day15 = new Date("2026-01-16T00:00:00Z");
    expect(isWithinVendorWindow(start, day15)).toBe(true);
  });

  it("accepte pile au 30e jour", () => {
    const day30 = new Date(start.getTime() + VENDOR_AFFILIATE_WINDOW_DAYS * 86_400_000);
    expect(isWithinVendorWindow(start, day30)).toBe(true);
  });

  it("refuse après 30 jours", () => {
    const day31 = new Date(start.getTime() + 31 * 86_400_000);
    expect(isWithinVendorWindow(start, day31)).toBe(false);
  });

  it("refuse une vente antérieure au début de fenêtre", () => {
    const before = new Date("2025-12-31T23:59:59Z");
    expect(isWithinVendorWindow(start, before)).toBe(false);
  });
});

describe("validateWithdrawal", () => {
  it("refuse sous le minimum", () => {
    const r = validateWithdrawal(10_000, MIN_WITHDRAWAL_AMOUNT - 1);
    expect(r.ok).toBe(false);
  });

  it("accepte pile au minimum si le solde suffit", () => {
    expect(validateWithdrawal(10_000, MIN_WITHDRAWAL_AMOUNT)).toEqual({ ok: true });
  });

  it("refuse si le montant dépasse le solde", () => {
    const r = validateWithdrawal(400, 500);
    expect(r.ok).toBe(false);
  });

  it("refuse un montant non entier ou négatif", () => {
    expect(validateWithdrawal(10_000, -100).ok).toBe(false);
    expect(validateWithdrawal(10_000, 500.5).ok).toBe(false);
  });

  it("accepte un retrait total du solde", () => {
    expect(validateWithdrawal(500, 500)).toEqual({ ok: true });
  });
});

describe("createWithdrawalSchema", () => {
  it("valide une demande correcte", () => {
    const parsed = createWithdrawalSchema.safeParse({ amount: 1000, method: "wave", phone: "0700000000" });
    expect(parsed.success).toBe(true);
  });

  it("rejette une méthode inconnue", () => {
    const parsed = createWithdrawalSchema.safeParse({ amount: 1000, method: "paypal", phone: "0700000000" });
    expect(parsed.success).toBe(false);
  });

  it("rejette un numéro invalide", () => {
    const parsed = createWithdrawalSchema.safeParse({ amount: 1000, method: "orange_money", phone: "12345" });
    expect(parsed.success).toBe(false);
  });
});

describe("getReferralLevel / getNextThreshold", () => {
  it("mappe les grades", () => {
    expect(getReferralLevel(0)).toBe("nouvo");
    expect(getReferralLevel(1)).toBe("kpata");
    expect(getReferralLevel(4)).toBe("kpata");
    expect(getReferralLevel(5)).toBe("boss");
    expect(getReferralLevel(14)).toBe("boss");
    expect(getReferralLevel(15)).toBe("grand_choco");
  });

  it("calcule le prochain palier", () => {
    expect(getNextThreshold(0)).toEqual({ nextLevel: "kpata", needed: 1 });
    expect(getNextThreshold(3)).toEqual({ nextLevel: "boss", needed: 2 });
    expect(getNextThreshold(14)).toEqual({ nextLevel: "grand_choco", needed: 1 });
    expect(getNextThreshold(15)).toBeNull();
  });
});
