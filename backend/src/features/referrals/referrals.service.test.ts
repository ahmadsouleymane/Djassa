import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { prisma } from "../../shared/db/client.js";
import { ReferralService } from "./referrals.service.js";
import { VENDOR_AFFILIATE_WINDOW_DAYS } from "./referrals.schema.js";

const referrerEmail = "aff-referrer@djassa.test";
const buyerEmail = "aff-buyer@djassa.test";
const vendorEmail = "aff-vendor@djassa.test";

let referrerId = "";
let buyerId = "";
let vendorId = "";
let buyerReferralId = "";
let vendorReferralId = "";

async function cleanup() {
  const emails = [referrerEmail, buyerEmail, vendorEmail];
  await prisma.referralReward.deleteMany({ where: { referrer: { email: { in: emails } } } });
  await prisma.withdrawal.deleteMany({ where: { user: { email: { in: emails } } } });
  await prisma.referral.deleteMany({ where: { referrer: { email: { in: emails } } } });
  await prisma.user.deleteMany({ where: { email: { in: emails } } });
}

beforeAll(async () => {
  await cleanup();
  const referrer = await prisma.user.create({
    data: { email: referrerEmail, passwordHash: "x", accountType: "client" },
  });
  const buyer = await prisma.user.create({
    data: { email: buyerEmail, passwordHash: "x", accountType: "client" },
  });
  const vendor = await prisma.user.create({
    data: { email: vendorEmail, passwordHash: "x", accountType: "vendeur" },
  });
  referrerId = referrer.id;
  buyerId = buyer.id;
  vendorId = vendor.id;
});

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

// Recrée des referrals propres avant chaque test + remet la cagnotte à zéro
beforeEach(async () => {
  await prisma.referralReward.deleteMany({ where: { referrerId } });
  await prisma.withdrawal.deleteMany({ where: { userId: referrerId } });
  await prisma.referral.deleteMany({ where: { referrerId } });
  await prisma.user.update({ where: { id: referrerId }, data: { walletBalance: 0 } });

  const buyerRef = await prisma.referral.create({
    data: { referrerId, referredEmail: buyerEmail, referredUserId: buyerId, status: "signed_up" },
  });
  const vendorRef = await prisma.referral.create({
    data: { referrerId, referredEmail: vendorEmail, referredUserId: vendorId, status: "signed_up" },
  });
  buyerReferralId = buyerRef.id;
  vendorReferralId = vendorRef.id;
});

async function balance() {
  const u = await prisma.user.findUnique({ where: { id: referrerId }, select: { walletBalance: true } });
  return u?.walletBalance ?? 0;
}

describe("Affiliation acheteur", () => {
  it("crédite 70% de la marge nette au premier achat éligible", async () => {
    await ReferralService.tryRewardReferrer(buyerId, "order-b1", 10_000);
    expect(await balance()).toBe(210); // 70% de 300
    const ref = await prisma.referral.findUnique({ where: { id: buyerReferralId } });
    expect(ref?.status).toBe("purchased");
    expect(ref?.rewardStatus).toBe("credited");
  });

  it("ne crédite pas deux fois (2e achat du même filleul)", async () => {
    await ReferralService.tryRewardReferrer(buyerId, "order-b1", 10_000);
    await ReferralService.tryRewardReferrer(buyerId, "order-b2", 50_000);
    expect(await balance()).toBe(210); // toujours seulement le 1er achat
  });

  it("ignore les commandes sous le seuil de 5 000 F", async () => {
    await ReferralService.tryRewardReferrer(buyerId, "order-b3", 3_000);
    expect(await balance()).toBe(0);
  });
});

describe("Affiliation vendeur", () => {
  it("crédite 70% sur chaque vente dans la fenêtre de 30 jours", async () => {
    await ReferralService.tryRewardVendorReferrer(vendorId, "order-v1", 10_000, new Date());
    await ReferralService.tryRewardVendorReferrer(vendorId, "order-v2", 50_000, new Date());
    expect(await balance()).toBe(210 + 1_330);
    const rewards = await prisma.referralReward.count({ where: { referrerId, kind: "vendor_sale" } });
    expect(rewards).toBe(2);
  });

  it("démarre la fenêtre à la première vente", async () => {
    await ReferralService.tryRewardVendorReferrer(vendorId, "order-v1", 10_000, new Date());
    const ref = await prisma.referral.findUnique({ where: { id: vendorReferralId } });
    expect(ref?.vendorWindowStartsAt).toBeTruthy();
  });

  it("est idempotent : la même commande ne crédite qu'une fois", async () => {
    const d = new Date();
    await ReferralService.tryRewardVendorReferrer(vendorId, "order-v1", 10_000, d);
    await ReferralService.tryRewardVendorReferrer(vendorId, "order-v1", 10_000, d);
    expect(await balance()).toBe(210);
  });

  it("ne crédite plus après 30 jours", async () => {
    // Fenêtre démarrée il y a 31 jours
    const start = new Date(Date.now() - 31 * 86_400_000);
    await prisma.referral.update({
      where: { id: vendorReferralId },
      data: { vendorWindowStartsAt: start },
    });
    await ReferralService.tryRewardVendorReferrer(vendorId, "order-late", 50_000, new Date());
    expect(await balance()).toBe(0);
  });

  it("crédite pile au dernier jour de la fenêtre", async () => {
    const start = new Date(Date.now() - VENDOR_AFFILIATE_WINDOW_DAYS * 86_400_000 + 60_000);
    await prisma.referral.update({
      where: { id: vendorReferralId },
      data: { vendorWindowStartsAt: start },
    });
    await ReferralService.tryRewardVendorReferrer(vendorId, "order-edge", 10_000, new Date());
    expect(await balance()).toBe(210);
  });
});

describe("Cagnotte & retraits", () => {
  it("débite la cagnotte lors d'un retrait valide", async () => {
    await ReferralService.tryRewardVendorReferrer(vendorId, "order-v1", 50_000, new Date());
    expect(await balance()).toBe(1_330);

    await ReferralService.requestWithdrawal(referrerId, { amount: 1_000, method: "wave", phone: "0700000000" });
    expect(await balance()).toBe(330);

    const withdrawals = await ReferralService.listWithdrawals(referrerId);
    expect(withdrawals).toHaveLength(1);
    expect(withdrawals[0]?.status).toBe("pending");
  });

  it("refuse un retrait au-dessus du solde", async () => {
    await ReferralService.tryRewardReferrer(buyerId, "order-b1", 10_000); // 210 F
    await expect(
      ReferralService.requestWithdrawal(referrerId, { amount: 5_000, method: "orange_money", phone: "0700000000" }),
    ).rejects.toThrow();
    expect(await balance()).toBe(210); // solde intact
  });

  it("recrédite la cagnotte si un retrait est rejeté par l'admin", async () => {
    await ReferralService.tryRewardVendorReferrer(vendorId, "order-v1", 50_000, new Date()); // 1330
    const w = await ReferralService.requestWithdrawal(referrerId, { amount: 1_000, method: "mtn", phone: "0700000000" });
    expect(await balance()).toBe(330);

    await ReferralService.adminSetWithdrawalStatus(w.id, "rejected");
    expect(await balance()).toBe(1_330); // recrédité

    // Rejet idempotent : un 2e appel ne recrédite pas
    const second = await ReferralService.adminSetWithdrawalStatus(w.id, "rejected");
    expect(second).toBeNull();
    expect(await balance()).toBe(1_330);
  });
});
