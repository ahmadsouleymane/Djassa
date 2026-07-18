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
      .send({ email, phone: "0700000000", password: "password123", accountType: "client" });

    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.email).toBe(email);
  });

  it("rejects duplicate registration", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email, phone: "0700000000", password: "password123", accountType: "client" });

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

describe("GET /api/auth/me + POST /api/auth/refresh", () => {
  const email = "auth-session-test@djassa.test";

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  it("rejects /me without a token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns the current user for a valid access token", async () => {
    const registerRes = await request(app)
      .post("/api/auth/register")
      .send({ email, phone: "0700000000", password: "password123", accountType: "vendeur" });

    const meRes = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${registerRes.body.accessToken}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.user.email).toBe(email);
  });

  it("issues a new access token from the refresh cookie", async () => {
    const registerRes = await request(app)
      .post("/api/auth/register")
      .send({ email: "auth-refresh-test@djassa.test", phone: "0700000000", password: "password123", accountType: "client" });

    const cookie = registerRes.headers["set-cookie"];
    const refreshRes = await request(app).post("/api/auth/refresh").set("Cookie", cookie);

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.accessToken).toBeDefined();

    await prisma.user.deleteMany({ where: { email: "auth-refresh-test@djassa.test" } });
  });

  it("rejects refresh without a cookie", async () => {
    const res = await request(app).post("/api/auth/refresh");
    expect(res.status).toBe(401);
  });
});
