import { describe, it, expect, afterAll, vi } from "vitest";
import request from "supertest";

vi.mock("../../services/geniusPay.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../services/geniusPay.js")>();
  return {
    ...actual,
    createPaymentSession: vi.fn().mockResolvedValue({ paymentUrl: "https://checkout.geniuspay.mock/test", reference: "MTX-MOCKED" }),
  };
});

import { app } from "../../app.js";
import { OrderService } from "./order.service.js";
import { signWebhookPayload } from "../../services/geniusPay.js";
import { prisma } from "../../shared/db/client.js";

describe("Order lifecycle", () => {
  const buyerEmail = "order-buyer@djassa.test";
  const vendorEmail = "order-vendor@djassa.test";
  const adminEmail = "admin@djassa.test";
  let buyerToken: string;
  let vendorToken: string;
  let productId: string;
  let chatMessageId: string;
  let orderId: string;

  afterAll(async () => {
    await prisma.order.deleteMany({ where: { buyer: { email: buyerEmail } } });
    await prisma.chatMessage.deleteMany({ where: { conversation: { buyer: { email: buyerEmail } } } });
    await prisma.conversation.deleteMany({ where: { buyer: { email: buyerEmail } } });
    await prisma.product.deleteMany({ where: { vendor: { email: vendorEmail } } });
    await prisma.user.deleteMany({ where: { email: { in: [buyerEmail, vendorEmail] } } });
    await prisma.$disconnect();
  });

  it("rejects order creation for an unverified vendor", async () => {
    const buyerRes = await request(app)
      .post("/api/auth/register")
      .send({ email: buyerEmail, phone: "0700000000", password: "password123", accountType: "client" });
    buyerToken = buyerRes.body.accessToken;

    const vendorRes = await request(app)
      .post("/api/auth/register")
      .send({ email: vendorEmail, phone: "0700000000", password: "password123", accountType: "vendeur" });
    vendorToken = vendorRes.body.accessToken;
    const vendorId = vendorRes.body.user.id;

    const productRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${vendorToken}`)
      .send({
        title: "Montre connectée",
        description: "Montre connectée étanche, autonomie 5 jours",
        price: 30000,
        category: "electronique",
        photos: [
          "https://res.cloudinary.com/demo/image/upload/montre-1.jpg",
          "https://res.cloudinary.com/demo/image/upload/montre-2.jpg",
          "https://res.cloudinary.com/demo/image/upload/montre-3.jpg",
        ],
      });
    productId = productRes.body.product.id;

    const conversationRes = await request(app)
      .post("/api/conversations")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ productId });

    const messageRes = await request(app)
      .post(`/api/conversations/${conversationRes.body.conversation.id}/messages`)
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ text: "Je propose 28000", offerPrice: 28000 });
    chatMessageId = messageRes.body.message.id;

    const orderRes = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ chatMessageId });
    expect(orderRes.status).toBe(422);

    // approve the vendor directly (admin endpoint arrives in Phase 5)
    await prisma.user.update({ where: { id: vendorId }, data: { sellerVerificationStatus: "approuvee" } });
  });

  it("creates the order once the vendor is verified", async () => {
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ chatMessageId });

    expect(res.status).toBe(201);
    expect(res.body.order.price).toBe(28000);
    expect(res.body.order.commissionAmount).toBe(1400);
    expect(res.body.order.status).toBe("en_attente_paiement");
    expect(res.body.order.confirmationCode).toBeDefined();
    orderId = res.body.order.id;
  });

  it("rejects a duplicate order for the same offer", async () => {
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ chatMessageId });
    expect(res.status).toBe(409);
  });

  it("does not expose confirmationCode to the vendor", async () => {
    const res = await request(app).get("/api/orders/mine").set("Authorization", `Bearer ${vendorToken}`);
    expect(res.status).toBe(200);
    const order = res.body.orders.find((o: { id: string }) => o.id === orderId);
    expect(order.confirmationCode).toBeUndefined();
  });

  it("checks out and pays via the webhook", async () => {
    const checkoutRes = await request(app)
      .post(`/api/orders/${orderId}/checkout`)
      .set("Authorization", `Bearer ${buyerToken}`);
    expect(checkoutRes.status).toBe(200);
    const { reference } = checkoutRes.body;

    const body = JSON.stringify({
      event: "payment.success",
      timestamp: new Date().toISOString(),
      data: {
        transaction: { reference: "MTX-TEST", status: "completed", amount: 7000 },
        metadata: { reference },
        environment: "sandbox",
      },
    });
    const signature = signWebhookPayload(body);

    const webhookRes = await request(app)
      .post("/api/billing/webhook/geniuspay")
      .set("Content-Type", "application/json")
      .set("X-GeniusPay-Event", "payment.success")
      .set("X-GeniusPay-Signature", signature)
      .send(body);
    expect(webhookRes.status).toBe(200);

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    expect(order?.status).toBe("paye");
    expect(order?.shipBy).not.toBeNull();
  });

  it("lets the vendor ship, buyer sees confirmationCode, vendor doesn't", async () => {
    const shipRes = await request(app)
      .post(`/api/orders/${orderId}/ship`)
      .set("Authorization", `Bearer ${vendorToken}`);
    expect(shipRes.status).toBe(200);
    expect(shipRes.body.order.confirmationCode).toBeUndefined();

    const buyerListRes = await request(app).get("/api/orders/mine").set("Authorization", `Bearer ${buyerToken}`);
    const buyerOrder = buyerListRes.body.orders.find((o: { id: string }) => o.id === orderId);
    expect(buyerOrder.confirmationCode).toBeDefined();
  });

  it("rejects confirmation from a non-buyer", async () => {
    const res = await request(app).post(`/api/orders/${orderId}/confirm`).set("Authorization", `Bearer ${vendorToken}`);
    expect(res.status).toBe(401);
  });

  it("lets the buyer confirm receipt", async () => {
    const res = await request(app).post(`/api/orders/${orderId}/confirm`).set("Authorization", `Bearer ${buyerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.order.status).toBe("confirme");
  });

  it("sweeps past-deadline orders automatically", async () => {
    const buyer2 = await request(app)
      .post("/api/auth/register")
      .send({ email: "order-buyer2@djassa.test", phone: "0700000000", password: "password123", accountType: "client" });

    const conversationRes = await request(app)
      .post("/api/conversations")
      .set("Authorization", `Bearer ${buyer2.body.accessToken}`)
      .send({ productId });
    const messageRes = await request(app)
      .post(`/api/conversations/${conversationRes.body.conversation.id}/messages`)
      .set("Authorization", `Bearer ${buyer2.body.accessToken}`)
      .send({ text: "Offre 2", offerPrice: 15000 });

    const orderRes = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${buyer2.body.accessToken}`)
      .send({ chatMessageId: messageRes.body.message.id });
    const overdueOrderId = orderRes.body.order.id;

    // backdate shipBy to simulate a vendor who never shipped
    await prisma.order.update({
      where: { id: overdueOrderId },
      data: { status: "paye", shipBy: new Date(Date.now() - 1000) },
    });

    const result = await OrderService.sweepTimeouts();
    expect(result.refunded).toBeGreaterThanOrEqual(1);

    const swept = await prisma.order.findUnique({ where: { id: overdueOrderId } });
    expect(swept?.status).toBe("rembourse");

    await prisma.order.deleteMany({ where: { id: overdueOrderId } });
    await prisma.chatMessage.deleteMany({ where: { id: messageRes.body.message.id } });
    await prisma.conversation.deleteMany({ where: { id: conversationRes.body.conversation.id } });
    await prisma.user.deleteMany({ where: { email: "order-buyer2@djassa.test" } });
  });

  it("opens and resolves a dispute (admin only)", async () => {
    const buyer3 = await request(app)
      .post("/api/auth/register")
      .send({ email: "order-buyer3@djassa.test", phone: "0700000000", password: "password123", accountType: "client" });

    const conversationRes = await request(app)
      .post("/api/conversations")
      .set("Authorization", `Bearer ${buyer3.body.accessToken}`)
      .send({ productId });
    const messageRes = await request(app)
      .post(`/api/conversations/${conversationRes.body.conversation.id}/messages`)
      .set("Authorization", `Bearer ${buyer3.body.accessToken}`)
      .send({ text: "Offre 3", offerPrice: 12000 });

    const orderRes = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${buyer3.body.accessToken}`)
      .send({ chatMessageId: messageRes.body.message.id });
    const disputeOrderId = orderRes.body.order.id;

    await prisma.order.update({ where: { id: disputeOrderId }, data: { status: "paye" } });

    const disputeRes = await request(app)
      .post(`/api/orders/${disputeOrderId}/dispute`)
      .set("Authorization", `Bearer ${buyer3.body.accessToken}`)
      .send({ reason: "Le produit décrit ne correspond pas à ce qui a été reçu" });
    expect(disputeRes.status).toBe(200);
    expect(disputeRes.body.order.status).toBe("en_litige");

    const nonAdminResolve = await request(app)
      .post(`/api/orders/${disputeOrderId}/dispute/resolve`)
      .set("Authorization", `Bearer ${buyer3.body.accessToken}`)
      .send({ resolution: "rembourse" });
    expect(nonAdminResolve.status).toBe(401);

    const adminRes = await request(app)
      .post("/api/auth/register")
      .send({ email: adminEmail, phone: "0700000000", password: "password123", accountType: "vendeur" });

    const adminResolve = await request(app)
      .post(`/api/orders/${disputeOrderId}/dispute/resolve`)
      .set("Authorization", `Bearer ${adminRes.body.accessToken}`)
      .send({ resolution: "rembourse" });
    expect(adminResolve.status).toBe(200);
    expect(adminResolve.body.order.status).toBe("rembourse");

    await prisma.order.deleteMany({ where: { id: disputeOrderId } });
    await prisma.chatMessage.deleteMany({ where: { id: messageRes.body.message.id } });
    await prisma.conversation.deleteMany({ where: { id: conversationRes.body.conversation.id } });
    await prisma.user.deleteMany({ where: { email: { in: ["order-buyer3@djassa.test", adminEmail] } } });
  });
});
