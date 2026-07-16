import { describe, it, expect, afterAll } from "vitest";
import { computeTrustScore } from "./trustScore.js";
import { UserRepository } from "../features/users/user.repository.js";
import { ProductRepository } from "../features/products/product.repository.js";
import { ConversationRepository } from "../features/conversations/conversation.repository.js";
import { MessageRepository } from "../features/conversations/message.repository.js";
import { OrderRepository } from "../features/orders/order.repository.js";
import { computeCommission } from "../config/marketplace.js";
import { prisma } from "../shared/db/client.js";

const userRepo = new UserRepository();
const productRepo = new ProductRepository();
const conversationRepo = new ConversationRepository();
const messageRepo = new MessageRepository();
const orderRepo = new OrderRepository();

async function setupVendorWithOrders(emailPrefix: string, disputedCount: number, cleanCount: number) {
  const buyer = await userRepo.create({ email: `${emailPrefix}-buyer@djassa.test`, passwordHash: "x", accountType: "client" });
  const vendor = await userRepo.create({ email: `${emailPrefix}-vendor@djassa.test`, passwordHash: "x", accountType: "vendeur" });
  const product = await productRepo.create({
    vendorId: vendor.id,
    title: "Produit test",
    description: "Produit utilisé uniquement pour le calcul du score de confiance",
    price: 10000,
    category: "autre",
    photos: ["https://res.cloudinary.com/demo/image/upload/x.jpg"],
  });
  const conversation = await conversationRepo.findOrCreate(buyer.id, vendor.id, product.id);
  await messageRepo.create({ conversationId: conversation.id, senderId: vendor.id, text: "Bonjour" });

  for (let i = 0; i < disputedCount + cleanCount; i++) {
    const message = await messageRepo.create({
      conversationId: conversation.id,
      senderId: buyer.id,
      text: `Offre ${i}`,
      offerPrice: 10000,
    });
    const { commissionAmount, netAmount } = computeCommission(10000, "standard");
    const order = await orderRepo.create({
      buyerId: buyer.id,
      vendorId: vendor.id,
      productId: product.id,
      chatMessageId: message.id,
      price: 10000,
      commissionAmount,
      netAmount,
      paymentReference: `trust-${emailPrefix}-${i}`,
      confirmationCode: "000000",
    });
    await orderRepo.update(order.id, { status: i < disputedCount ? "en_litige" : "confirme" });
  }

  return { buyerId: buyer.id, vendorId: vendor.id, productId: product.id };
}

describe("computeTrustScore", () => {
  const prefixes = ["trust-good", "trust-bad"];

  afterAll(async () => {
    for (const prefix of prefixes) {
      await prisma.order.deleteMany({ where: { vendor: { email: { contains: `${prefix}-vendor` } } } });
      await prisma.chatMessage.deleteMany({ where: { conversation: { vendor: { email: { contains: `${prefix}-vendor` } } } } });
      await prisma.conversation.deleteMany({ where: { vendor: { email: { contains: `${prefix}-vendor` } } } });
      await prisma.product.deleteMany({ where: { vendor: { email: { contains: `${prefix}-vendor` } } } });
      await prisma.user.deleteMany({ where: { email: { contains: prefix } } });
    }
    await prisma.$disconnect();
  });

  it("scores a vendor with no disputes higher than one with many disputes", async () => {
    const good = await setupVendorWithOrders("trust-good", 0, 5);
    const bad = await setupVendorWithOrders("trust-bad", 4, 1);

    const goodScore = await computeTrustScore(good.vendorId);
    const badScore = await computeTrustScore(bad.vendorId);

    expect(goodScore.score).toBeGreaterThan(badScore.score);
    expect(goodScore.disputeRate).toBe(0);
    expect(badScore.disputeRate).toBeCloseTo(0.8);
  });

  it("returns a neutral baseline for an unknown vendor gracefully", async () => {
    const result = await computeTrustScore("00000000-0000-0000-0000-000000000000");
    expect(result.score).toBe(0);
  });
});
