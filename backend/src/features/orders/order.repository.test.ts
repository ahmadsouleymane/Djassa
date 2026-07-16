import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { OrderRepository } from "./order.repository.js";
import { UserRepository } from "../users/user.repository.js";
import { ProductRepository } from "../products/product.repository.js";
import { ConversationRepository } from "../conversations/conversation.repository.js";
import { MessageRepository } from "../conversations/message.repository.js";
import { computeCommission } from "../../config/marketplace.js";
import { prisma } from "../../shared/db/client.js";

const orderRepo = new OrderRepository();
const userRepo = new UserRepository();
const productRepo = new ProductRepository();
const conversationRepo = new ConversationRepository();
const messageRepo = new MessageRepository();

let buyerId: string;
let vendorId: string;
let productId: string;
let chatMessageId: string;

describe("OrderRepository", () => {
  beforeAll(async () => {
    const buyer = await userRepo.create({ email: "order-repo-buyer@djassa.test", passwordHash: "x", accountType: "client" });
    const vendor = await userRepo.create({ email: "order-repo-vendor@djassa.test", passwordHash: "x", accountType: "vendeur" });
    buyerId = buyer.id;
    vendorId = vendor.id;

    const product = await productRepo.create({
      vendorId,
      title: "Sac",
      description: "Sac en cuir véritable, plusieurs coloris",
      price: 20000,
      category: "mode_beaute",
      photos: ["https://res.cloudinary.com/demo/image/upload/sac.jpg"],
    });
    productId = product.id;

    const conversation = await conversationRepo.findOrCreate(buyerId, vendorId, productId);
    const message = await messageRepo.create({
      conversationId: conversation.id,
      senderId: buyerId,
      text: "Je propose 18000",
      offerPrice: 18000,
    });
    chatMessageId = message.id;
  });

  afterAll(async () => {
    await prisma.order.deleteMany({ where: { buyerId } });
    await prisma.chatMessage.deleteMany({ where: { conversation: { buyerId } } });
    await prisma.conversation.deleteMany({ where: { buyerId } });
    await prisma.product.deleteMany({ where: { vendorId } });
    await prisma.user.deleteMany({ where: { id: { in: [buyerId, vendorId] } } });
    await prisma.$disconnect();
  });

  it("creates an order with correct commission split", async () => {
    const { commissionAmount, netAmount } = computeCommission(18000, "standard");
    const order = await orderRepo.create({
      buyerId,
      vendorId,
      productId,
      chatMessageId,
      price: 18000,
      commissionAmount,
      netAmount,
      paymentReference: "test-ref-1",
      confirmationCode: "123456",
    });

    expect(order.commissionAmount).toBe(900);
    expect(order.netAmount).toBe(17100);
  });

  it("lists orders by participant", async () => {
    const list = await orderRepo.findByParticipant(buyerId);
    expect(list.length).toBeGreaterThan(0);
  });
});
