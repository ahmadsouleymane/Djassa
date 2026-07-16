import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import { prisma } from "../../shared/db/client.js";

describe("GET /api/public/products", () => {
  const email = "public-feed-vendor@djassa.test";
  let productId: string;

  afterAll(async () => {
    await prisma.product.deleteMany({ where: { vendor: { email } } });
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  it("hides products from an unverified vendor", async () => {
    const regRes = await request(app)
      .post("/api/auth/register")
      .send({ email, password: "password123", accountType: "vendeur" });

    const createRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${regRes.body.accessToken}`)
      .send({
        title: "Sac à main",
        description: "Sac à main en cuir, plusieurs coloris disponibles",
        price: 18000,
        category: "mode_beaute",
        photos: ["https://res.cloudinary.com/demo/image/upload/sac.jpg"],
      });
    productId = createRes.body.product.id;

    const before = await request(app).get("/api/public/products");
    expect(before.body.products.some((p: { id: string }) => p.id === productId)).toBe(false);

    await prisma.user.update({
      where: { id: regRes.body.user.id },
      data: { sellerVerificationStatus: "approuvee" },
    });

    const res = await request(app).get("/api/public/products");
    expect(res.status).toBe(200);
    expect(res.body.products.some((p: { id: string }) => p.id === productId)).toBe(true);
  });

  it("filters by category", async () => {
    const res = await request(app).get("/api/public/products?category=electronique");
    expect(res.status).toBe(200);
    expect(res.body.products.every((p: { category: string }) => p.category === "electronique")).toBe(true);
  });

  it("ignores an invalid category value instead of erroring", async () => {
    const res = await request(app).get("/api/public/products?category=not-a-real-category");
    expect(res.status).toBe(200);
  });
});
