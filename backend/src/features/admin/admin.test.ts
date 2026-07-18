import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import { prisma } from "../../shared/db/client.js";

describe("Admin dashboard", () => {
  const adminEmail = "admin-dashboard-test@djassa.test";
  const clientEmail = "admin-test-client@djassa.test";
  let adminToken: string;
  let clientToken: string;

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: [clientEmail, adminEmail] } } });
    await prisma.$disconnect();
  });

  it("registers an admin and a regular client", async () => {
    const adminRes = await request(app)
      .post("/api/auth/register")
      .send({ email: adminEmail, phone: "0700000000", password: "password123", accountType: "vendeur" });
    adminToken = adminRes.body.accessToken;

    const clientRes = await request(app)
      .post("/api/auth/register")
      .send({ email: clientEmail, phone: "0700000000", password: "password123", accountType: "client" });
    clientToken = clientRes.body.accessToken;

    expect(adminToken).toBeDefined();
    expect(clientToken).toBeDefined();
  });

  it("rejects a non-admin from the overview endpoint", async () => {
    const res = await request(app).get("/api/admin/overview").set("Authorization", `Bearer ${clientToken}`);
    expect(res.status).toBe(401);
  });

  it("lets the admin fetch the overview", async () => {
    const res = await request(app).get("/api/admin/overview").set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.users).toBeDefined();
    expect(res.body.orders).toBeDefined();
    expect(typeof res.body.openDisputes).toBe("number");
  });

  it("lets the admin list disputes and reports", async () => {
    const disputesRes = await request(app).get("/api/admin/disputes").set("Authorization", `Bearer ${adminToken}`);
    expect(disputesRes.status).toBe(200);
    expect(Array.isArray(disputesRes.body.disputes)).toBe(true);

    const reportsRes = await request(app).get("/api/admin/reports").set("Authorization", `Bearer ${adminToken}`);
    expect(reportsRes.status).toBe(200);
    expect(Array.isArray(reportsRes.body.reports)).toBe(true);
  });

  it("lets a client file a report and the admin resolve it", async () => {
    const createRes = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${clientToken}`)
      .send({ targetType: "produit", targetId: "00000000-0000-0000-0000-000000000000", reason: "Photo trompeuse, produit non conforme" });
    expect(createRes.status).toBe(201);
    const reportId = createRes.body.report.id;

    const resolveRes = await request(app)
      .post(`/api/admin/reports/${reportId}/resolve`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "traite", adminNote: "Vérifié, produit retiré" });
    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body.report.status).toBe("traite");

    await prisma.report.deleteMany({ where: { id: reportId } });
  });

  it("rejects a non-admin from sending broadcast emails", async () => {
    const res = await request(app)
      .post("/api/admin/emails/send")
      .set("Authorization", `Bearer ${clientToken}`)
      .send({ recipientFilter: "custom", customEmail: "someone@djassa.test", subject: "Test", body: "Ceci est un test de contenu" });
    expect(res.status).toBe(401);
  });

  it("lets the admin send a broadcast email (no-op without RESEND_API_KEY) and logs it", async () => {
    const res = await request(app)
      .post("/api/admin/emails/send")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ recipientFilter: "custom", customEmail: "someone@djassa.test", subject: "Test", body: "Ceci est un test de contenu" });
    expect(res.status).toBe(200);
    expect(res.body.recipientCount).toBe(1);

    const historyRes = await request(app).get("/api/admin/emails/history").set("Authorization", `Bearer ${adminToken}`);
    expect(historyRes.status).toBe(200);
    expect(historyRes.body.emails.length).toBeGreaterThanOrEqual(1);

    await prisma.sentEmail.deleteMany({ where: { subject: "Test" } });
  });
});
