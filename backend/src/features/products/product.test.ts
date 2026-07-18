import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import { prisma } from "../../shared/db/client.js";

describe("Product CRUD", () => {
  const vendorEmail = "product-crud-vendor@djassa.test";
  const otherEmail = "product-crud-other@djassa.test";
  const clientEmail = "product-crud-client@djassa.test";
  let vendorToken: string;
  let otherToken: string;
  let productId: string;

  afterAll(async () => {
    await prisma.product.deleteMany({ where: { vendor: { email: { in: [vendorEmail, otherEmail] } } } });
    await prisma.user.deleteMany({ where: { email: { in: [vendorEmail, otherEmail, clientEmail] } } });
    await prisma.$disconnect();
  });

  it("rejects product creation from a client account", async () => {
    const clientRes = await request(app)
      .post("/api/auth/register")
      .send({ email: clientEmail, phone: "0700000000", password: "password123", accountType: "client" });

    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${clientRes.body.accessToken}`)
      .send({
        title: "Produit interdit",
        description: "Un client ne devrait pas pouvoir créer ceci",
        price: 1000,
        category: "autre",
        photos: ["https://res.cloudinary.com/demo/image/upload/x.jpg"],
      });

    expect(res.status).toBe(401);
  });

  it("registers two vendors for the test", async () => {
    const vendorRes = await request(app)
      .post("/api/auth/register")
      .send({ email: vendorEmail, phone: "0700000000", password: "password123", accountType: "vendeur" });
    vendorToken = vendorRes.body.accessToken;

    const otherRes = await request(app)
      .post("/api/auth/register")
      .send({ email: otherEmail, phone: "0700000000", password: "password123", accountType: "vendeur" });
    otherToken = otherRes.body.accessToken;

    expect(vendorToken).toBeDefined();
    expect(otherToken).toBeDefined();
  });

  it("creates a product", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${vendorToken}`)
      .send({
        title: "Chaussures homme",
        description: "Chaussures en cuir véritable, pointure 42",
        price: 25000,
        category: "mode_beaute",
        photos: [
          "https://res.cloudinary.com/demo/image/upload/chaussures-1.jpg",
          "https://res.cloudinary.com/demo/image/upload/chaussures-2.jpg",
          "https://res.cloudinary.com/demo/image/upload/chaussures-3.jpg",
        ],
      });

    expect(res.status).toBe(201);
    productId = res.body.product.id;
  });

  it("lists the vendor's own products", async () => {
    const res = await request(app).get("/api/products/mine").set("Authorization", `Bearer ${vendorToken}`);
    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(1);
  });

  it("rejects updates from a non-owner vendor", async () => {
    const res = await request(app)
      .patch(`/api/products/${productId}`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ price: 1 });

    expect(res.status).toBe(401);
  });

  it("allows the owner to update their product", async () => {
    const res = await request(app)
      .patch(`/api/products/${productId}`)
      .set("Authorization", `Bearer ${vendorToken}`)
      .send({ price: 22000 });

    expect(res.status).toBe(200);
    expect(res.body.product.price).toBe(22000);
  });

  it("allows the owner to delete their product", async () => {
    const res = await request(app).delete(`/api/products/${productId}`).set("Authorization", `Bearer ${vendorToken}`);
    expect(res.status).toBe(204);
  });
});
