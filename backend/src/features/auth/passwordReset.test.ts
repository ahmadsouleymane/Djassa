import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import { prisma } from "../../shared/db/client.js";
import { AuthService } from "./auth.service.js";

describe("Password reset", () => {
  const email = "reset-flow@djassa.test";

  afterAll(async () => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  it("registers the account used for the reset flow", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email, phone: "0700000000", password: "password123", accountType: "client" });
    expect(res.status).toBe(201);
  });

  it("returns a generic success message even for an unknown email", async () => {
    const res = await request(app).post("/api/auth/forgot-password").send({ email: "nobody@djassa.test" });
    expect(res.status).toBe(200);
  });

  it("rejects a reset with an invalid token", async () => {
    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: "not-a-real-token-not-a-real-token", password: "newpassword123", confirmPassword: "newpassword123" });
    expect(res.status).toBe(422);
  });

  it("rejects a reset when passwords don't match", async () => {
    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: "whatever-token-value-here", password: "newpassword123", confirmPassword: "different" });
    expect(res.status).toBe(422);
  });

  it("lets the user reset their password with a valid token, then log in with it", async () => {
    const token = await AuthService.forgotPassword(email);
    expect(token).toBeDefined();

    const resetRes = await request(app)
      .post("/api/auth/reset-password")
      .send({ token, password: "newpassword123", confirmPassword: "newpassword123" });
    expect(resetRes.status).toBe(200);

    const loginRes = await request(app).post("/api/auth/login").send({ email, password: "newpassword123" });
    expect(loginRes.status).toBe(200);

    const oldLoginRes = await request(app).post("/api/auth/login").send({ email, password: "password123" });
    expect(oldLoginRes.status).toBe(401);
  });

  it("rejects reusing the same token twice", async () => {
    const token = await AuthService.forgotPassword(email);
    await request(app)
      .post("/api/auth/reset-password")
      .send({ token, password: "anotherpassword123", confirmPassword: "anotherpassword123" });

    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ token, password: "yetanotherpassword", confirmPassword: "yetanotherpassword" });
    expect(res.status).toBe(422);
  });
});
