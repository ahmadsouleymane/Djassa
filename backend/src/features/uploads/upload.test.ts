import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import { prisma } from "../../shared/db/client.js";

describe("POST /api/uploads/sign", () => {
  const email = "upload-test@djassa.test";

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  it("rejects unauthenticated requests", async () => {
    const res = await request(app).post("/api/uploads/sign");
    expect(res.status).toBe(401);
  });

  it("returns a signed payload for an authenticated vendor", async () => {
    const registerRes = await request(app)
      .post("/api/auth/register")
      .send({ email, password: "password123", accountType: "vendeur" });

    const res = await request(app)
      .post("/api/uploads/sign")
      .set("Authorization", `Bearer ${registerRes.body.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.signature).toBeDefined();
    expect(res.body.cloudName).toBeDefined();
    expect(res.body.folder).toContain(registerRes.body.user.id);
  });
});
