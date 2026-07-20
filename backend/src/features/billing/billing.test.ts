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
import { signWebhookPayload } from "../../services/geniusPay.js";
import { prisma } from "../../shared/db/client.js";

function makeWebhookPayload(reference: string) {
  return JSON.stringify({
    event: "payment.success",
    timestamp: new Date().toISOString(),
    data: {
      transaction: {
        reference: `MTX-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
        status: "completed",
        amount: 7000,
      },
      metadata: { reference },
      environment: "sandbox",
    },
  });
}

describe("POST /api/billing/webhook/geniuspay", () => {
  it("rejects an invalid signature", async () => {
    const res = await request(app)
      .post("/api/billing/webhook/geniuspay")
      .set("Content-Type", "application/json")
      .set("X-GeniusPay-Event", "payment.success")
      .set("X-GeniusPay-Signature", "bad-signature")
      .send(makeWebhookPayload("unknown"));

    expect(res.status).toBe(401);
  });

  it("accepts a validly signed payload for an unknown reference without erroring", async () => {
    const body = makeWebhookPayload("unknown-ref");
    const signature = signWebhookPayload(body);

    const res = await request(app)
      .post("/api/billing/webhook/geniuspay")
      .set("Content-Type", "application/json")
      .set("X-GeniusPay-Event", "payment.success")
      .set("X-GeniusPay-Signature", signature)
      .send(body);

    expect(res.status).toBe(200);
  });
});

describe("POST /api/billing/subscribe + GET /api/billing/me", () => {
  const vendorEmail = "billing-vendor@djassa.test";
  const clientEmail = "billing-client@djassa.test";

  afterAll(async () => {
    await prisma.payment.deleteMany({ where: { user: { email: { in: [vendorEmail, clientEmail] } } } });
    await prisma.user.deleteMany({ where: { email: { in: [vendorEmail, clientEmail] } } });
    await prisma.$disconnect();
  });

  it("rejects a client account", async () => {
    const clientRes = await request(app)
      .post("/api/auth/register")
      .send({ email: clientEmail, phone: "0700000000", password: "password123", accountType: "client" });

    const res = await request(app)
      .post("/api/billing/subscribe")
      .set("Authorization", `Bearer ${clientRes.body.accessToken}`);

    expect(res.status).toBe(401);
  });

  it("lets a vendor checkout and activates Pro via the webhook", async () => {
    const vendorRes = await request(app)
      .post("/api/auth/register")
      .send({ email: vendorEmail, phone: "0700000000", password: "password123", accountType: "vendeur" });
    const vendorToken = vendorRes.body.accessToken;

    const checkoutRes = await request(app)
      .post("/api/billing/subscribe")
      .set("Authorization", `Bearer ${vendorToken}`);
    expect(checkoutRes.status).toBe(200);
    const { reference } = checkoutRes.body;

    const body = makeWebhookPayload(reference);
    const signature = signWebhookPayload(body);

    const webhookRes = await request(app)
      .post("/api/billing/webhook/geniuspay")
      .set("Content-Type", "application/json")
      .set("X-GeniusPay-Event", "payment.success")
      .set("X-GeniusPay-Signature", signature)
      .send(body);
    expect(webhookRes.status).toBe(200);

    const meRes = await request(app).get("/api/billing/me").set("Authorization", `Bearer ${vendorToken}`);
    expect(meRes.body.planTier).toBe("pro");
    expect(meRes.body.planPeriodEnd).toBeDefined();
  });

  it("stacks a second subscription period instead of overwriting it", async () => {
    const vendorRes = await request(app)
      .post("/api/auth/login")
      .send({ email: vendorEmail, password: "password123" });
    const vendorToken = vendorRes.body.accessToken;

    const beforeRes = await request(app).get("/api/billing/me").set("Authorization", `Bearer ${vendorToken}`);
    const before = new Date(beforeRes.body.planPeriodEnd);

    const checkoutRes = await request(app)
      .post("/api/billing/subscribe")
      .set("Authorization", `Bearer ${vendorToken}`);
    const { reference } = checkoutRes.body;

    const body = makeWebhookPayload(reference);
    const signature = signWebhookPayload(body);

    await request(app)
      .post("/api/billing/webhook/geniuspay")
      .set("Content-Type", "application/json")
      .set("X-GeniusPay-Event", "payment.success")
      .set("X-GeniusPay-Signature", signature)
      .send(body);

    const afterRes = await request(app).get("/api/billing/me").set("Authorization", `Bearer ${vendorToken}`);
    const after = new Date(afterRes.body.planPeriodEnd);

    expect(after.getTime()).toBeGreaterThan(before.getTime());
  });
});
