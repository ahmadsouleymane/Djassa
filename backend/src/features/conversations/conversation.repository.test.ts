import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { ConversationRepository } from "./conversation.repository.js";
import { MessageRepository } from "./message.repository.js";
import { UserRepository } from "../users/user.repository.js";
import { ProductRepository } from "../products/product.repository.js";
import { prisma } from "../../shared/db/client.js";

const conversationRepo = new ConversationRepository();
const messageRepo = new MessageRepository();
const userRepo = new UserRepository();
const productRepo = new ProductRepository();

let buyerId: string;
let vendorId: string;
let productId: string;

describe("ConversationRepository + MessageRepository", () => {
  beforeAll(async () => {
    const buyer = await userRepo.create({ email: "conv-buyer@djassa.test", passwordHash: "x", accountType: "client" });
    const vendor = await userRepo.create({
      email: "conv-vendor@djassa.test",
      passwordHash: "x",
      accountType: "vendeur",
    });
    buyerId = buyer.id;
    vendorId = vendor.id;

    const product = await productRepo.create({
      vendorId,
      title: "Montre",
      description: "Montre connectée, garantie 1 an",
      price: 30000,
      category: "electronique",
      photos: ["https://res.cloudinary.com/demo/image/upload/montre.jpg"],
    });
    productId = product.id;
  });

  afterAll(async () => {
    await prisma.chatMessage.deleteMany({ where: { conversation: { buyerId } } });
    await prisma.conversation.deleteMany({ where: { buyerId } });
    await prisma.product.deleteMany({ where: { vendorId } });
    await prisma.user.deleteMany({ where: { id: { in: [buyerId, vendorId] } } });
    await prisma.$disconnect();
  });

  it("creates a conversation once and returns the same one on repeat calls", async () => {
    const first = await conversationRepo.findOrCreate(buyerId, vendorId, productId);
    const second = await conversationRepo.findOrCreate(buyerId, vendorId, productId);
    expect(second.id).toBe(first.id);
  });

  it("stores and retrieves messages in order", async () => {
    const conversation = await conversationRepo.findOrCreate(buyerId, vendorId, productId);
    await messageRepo.create({ conversationId: conversation.id, senderId: buyerId, text: "Bonjour, dispo ?" });
    await messageRepo.create({
      conversationId: conversation.id,
      senderId: vendorId,
      text: "Oui, je peux faire 28000",
      offerPrice: 28000,
    });

    const messages = await messageRepo.findByConversation(conversation.id);
    expect(messages).toHaveLength(2);
    expect(messages[1].offerPrice).toBe(28000);
  });

  it("lists conversations by participant", async () => {
    const list = await conversationRepo.findByParticipant(buyerId);
    expect(list.length).toBeGreaterThan(0);
  });
});
