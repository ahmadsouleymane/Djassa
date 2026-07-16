import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import { prisma } from "../../shared/db/client.js";

describe("POST /api/auth/register + /api/auth/login", () => {
  const email = "auth-test@djassa.test";

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  it("registers a new user and returns an access token", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email, password: "password123", accountType: "client" });

    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.email).toBe(email);
  });

  it("rejects duplicate registration", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email, password: "password123", accountType: "client" });

    expect(res.status).toBe(409);
  });

  it("logs in with correct credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({ email, password: "password123" });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
  });

  it("rejects wrong password", async () => {
    const res = await request(app).post("/api/auth/login").send({ email, password: "wrong" });
    expect(res.status).toBe(401);
  });
});
