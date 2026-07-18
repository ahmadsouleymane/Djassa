import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import { prisma } from "../../shared/db/client.js";

describe("Reviews", () => {
  const buyerEmail = "review-buyer@djassa.test";
  const vendorEmail = "review-vendor@djassa.test";
  let buyerToken: string;
  let vendorId: string;
  let orderId: string;

  afterAll(async () => {
    await prisma.review.deleteMany({ where: { vendorId } });
    await prisma.order.deleteMany({ where: { vendorId } });
    await prisma.chatMessage.deleteMany({ where: { conversation: { vendorId } } });
    await prisma.conversation.deleteMany({ where: { vendorId } });
    await prisma.product.deleteMany({ where: { vendorId } });
    await prisma.user.deleteMany({ where: { email: { in: [buyerEmail, vendorEmail] } } });
    await prisma.$disconnect();
  });

  it("sets up a confirmed order", async () => {
    const buyerRes = await request(app)
      .post("/api/auth/register")
      .send({ email: buyerEmail, phone: "0700000000", password: "password123", accountType: "client" });
    buyerToken = buyerRes.body.accessToken;

    const vendorRes = await request(app)
      .post("/api/auth/register")
      .send({ email: vendorEmail, phone: "0700000000", password: "password123", accountType: "vendeur" });
    vendorId = vendorRes.body.user.id;
    await prisma.user.update({ where: { id: vendorId }, data: { sellerVerificationStatus: "approuvee" } });

    const productRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${vendorRes.body.accessToken}`)
      .send({
        title: "Lampe",
        description: "Lampe de bureau LED, réglable en intensité",
        price: 9000,
        category: "maison",
        photos: [
          "https://res.cloudinary.com/demo/image/upload/lampe-1.jpg",
          "https://res.cloudinary.com/demo/image/upload/lampe-2.jpg",
          "https://res.cloudinary.com/demo/image/upload/lampe-3.jpg",
        ],
      });

    const conversationRes = await request(app)
      .post("/api/conversations")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ productId: productRes.body.product.id });
    const messageRes = await request(app)
      .post(`/api/conversations/${conversationRes.body.conversation.id}/messages`)
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ text: "Offre", offerPrice: 9000 });

    const orderRes = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ chatMessageId: messageRes.body.message.id });
    orderId = orderRes.body.order.id;

    expect(orderRes.status).toBe(201);
  });

  it("rejects a review before the order is confirmed", async () => {
    const res = await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ orderId, rating: 5, comment: "Très bon vendeur" });
    expect(res.status).toBe(422);
  });

  it("allows a review once confirmed, rejects a duplicate", async () => {
    await prisma.order.update({ where: { id: orderId }, data: { status: "confirme" } });

    const res = await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ orderId, rating: 5, comment: "Très bon vendeur, produit conforme" });
    expect(res.status).toBe(201);

    const dup = await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ orderId, rating: 4, comment: "Deuxième avis, ne devrait pas passer" });
    expect(dup.status).toBe(409);
  });

  it("lists reviews publicly without auth", async () => {
    const res = await request(app).get(`/api/public/vendors/${vendorId}/reviews`);
    expect(res.status).toBe(200);
    expect(res.body.reviews).toHaveLength(1);
  });
});
