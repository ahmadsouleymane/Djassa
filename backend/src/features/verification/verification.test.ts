import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import { prisma } from "../../shared/db/client.js";

describe("Seller verification", () => {
  const vendorEmail = "verif-vendor@djassa.test";
  const clientEmail = "verif-client@djassa.test";
  const adminEmail = "admin@djassa.test";
  let vendorToken: string;
  let vendorId: string;

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: [vendorEmail, clientEmail, adminEmail] } } });
    await prisma.$disconnect();
  });

  it("rejects submission from a client account", async () => {
    const clientRes = await request(app)
      .post("/api/auth/register")
      .send({ email: clientEmail, phone: "0700000000", password: "password123", accountType: "client" });

    const res = await request(app)
      .post("/api/verification/submit")
      .set("Authorization", `Bearer ${clientRes.body.accessToken}`)
      .send({ documentUrl: "https://res.cloudinary.com/demo/image/upload/id.jpg" });

    expect(res.status).toBe(401);
  });

  it("lets a vendor submit and see pending status", async () => {
    const vendorRes = await request(app)
      .post("/api/auth/register")
      .send({ email: vendorEmail, phone: "0700000000", password: "password123", accountType: "vendeur" });
    vendorToken = vendorRes.body.accessToken;
    vendorId = vendorRes.body.user.id;

    const submitRes = await request(app)
      .post("/api/verification/submit")
      .set("Authorization", `Bearer ${vendorToken}`)
      .send({ documentUrl: "https://res.cloudinary.com/demo/image/upload/id.jpg" });
    expect(submitRes.status).toBe(200);

    const statusRes = await request(app)
      .get("/api/verification/status")
      .set("Authorization", `Bearer ${vendorToken}`);
    expect(statusRes.body.status).toBe("en_attente");
  });

  it("rejects a non-admin listing pending verifications", async () => {
    const res = await request(app)
      .get("/api/verification/admin/pending")
      .set("Authorization", `Bearer ${vendorToken}`);
    expect(res.status).toBe(401);
  });

  it("lets an admin approve a pending vendor", async () => {
    const adminRes = await request(app)
      .post("/api/auth/register")
      .send({ email: adminEmail, phone: "0700000000", password: "password123", accountType: "vendeur" });

    const pendingRes = await request(app)
      .get("/api/verification/admin/pending")
      .set("Authorization", `Bearer ${adminRes.body.accessToken}`);
    expect(pendingRes.status).toBe(200);
    expect(pendingRes.body.users.some((u: { id: string }) => u.id === vendorId)).toBe(true);

    const approveRes = await request(app)
      .post(`/api/verification/admin/${vendorId}/approve`)
      .set("Authorization", `Bearer ${adminRes.body.accessToken}`);
    expect(approveRes.status).toBe(200);

    const statusRes = await request(app)
      .get("/api/verification/status")
      .set("Authorization", `Bearer ${vendorToken}`);
    expect(statusRes.body.status).toBe("approuvee");
  });
});
