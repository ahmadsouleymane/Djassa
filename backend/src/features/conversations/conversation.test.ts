import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import { prisma } from "../../shared/db/client.js";

describe("Conversations", () => {
  const buyerEmail = "chat-buyer@djassa.test";
  const vendorEmail = "chat-vendor@djassa.test";
  let buyerToken: string;
  let vendorToken: string;
  let vendorId: string;
  let productId: string;
  let conversationId: string;

  afterAll(async () => {
    await prisma.chatMessage.deleteMany({ where: { conversation: { vendorId } } });
    await prisma.conversation.deleteMany({ where: { vendorId } });
    await prisma.product.deleteMany({ where: { vendorId } });
    await prisma.user.deleteMany({ where: { email: { in: [buyerEmail, vendorEmail] } } });
    await prisma.$disconnect();
  });

  it("sets up a buyer, a vendor and a product", async () => {
    const buyerRes = await request(app)
      .post("/api/auth/register")
      .send({ email: buyerEmail, phone: "0700000000", password: "password123", accountType: "client" });
    buyerToken = buyerRes.body.accessToken;

    const vendorRes = await request(app)
      .post("/api/auth/register")
      .send({ email: vendorEmail, phone: "0700000000", password: "password123", accountType: "vendeur" });
    vendorToken = vendorRes.body.accessToken;
    vendorId = vendorRes.body.user.id;

    const productRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${vendorToken}`)
      .send({
        title: "Casque audio",
        description: "Casque bluetooth, autonomie 20h",
        price: 12000,
        category: "electronique",
        photos: [
          "https://res.cloudinary.com/demo/image/upload/casque-1.jpg",
          "https://res.cloudinary.com/demo/image/upload/casque-2.jpg",
          "https://res.cloudinary.com/demo/image/upload/casque-3.jpg",
        ],
      });
    productId = productRes.body.product.id;

    expect(buyerToken).toBeDefined();
    expect(productId).toBeDefined();
  });

  it("rejects a vendor starting a conversation on their own product", async () => {
    const res = await request(app)
      .post("/api/conversations")
      .set("Authorization", `Bearer ${vendorToken}`)
      .send({ productId });

    expect(res.status).toBe(422);
  });

  it("lets a buyer start a conversation", async () => {
    const res = await request(app)
      .post("/api/conversations")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ productId });

    expect(res.status).toBe(201);
    conversationId = res.body.conversation.id;
  });

  it("returns the same conversation on a repeat start call", async () => {
    const res = await request(app)
      .post("/api/conversations")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ productId });

    expect(res.body.conversation.id).toBe(conversationId);
  });

  it("lets the buyer send a message with a price offer", async () => {
    const res = await request(app)
      .post(`/api/conversations/${conversationId}/messages`)
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ text: "Je propose 10000", offerPrice: 10000 });

    expect(res.status).toBe(201);
    expect(res.body.message.offerPrice).toBe(10000);
  });

  it("lets the vendor read the message history", async () => {
    const res = await request(app)
      .get(`/api/conversations/${conversationId}/messages`)
      .set("Authorization", `Bearer ${vendorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.messages).toHaveLength(1);
  });

  it("rejects a third party from reading the conversation", async () => {
    const outsiderRes = await request(app)
      .post("/api/auth/register")
      .send({ email: "chat-outsider@djassa.test", phone: "0700000000", password: "password123", accountType: "client" });

    const res = await request(app)
      .get(`/api/conversations/${conversationId}/messages`)
      .set("Authorization", `Bearer ${outsiderRes.body.accessToken}`);

    expect(res.status).toBe(401);
    await prisma.user.deleteMany({ where: { email: "chat-outsider@djassa.test" } });
  });

  it("lists the buyer's conversations", async () => {
    const res = await request(app).get("/api/conversations/mine").set("Authorization", `Bearer ${buyerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.conversations.length).toBeGreaterThan(0);
  });
});
