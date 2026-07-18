import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import { prisma } from "../../shared/db/client.js";

describe("POST /api/waitlist", () => {
  const email = "waitlist-signup@djassa.test";

  afterAll(async () => {
    await prisma.waitlistSignup.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  it("creates a waitlist signup", async () => {
    const res = await request(app)
      .post("/api/waitlist")
      .send({ firstName: "Awa", lastName: "Koné", email });

    expect(res.status).toBe(201);
    expect(res.body.signup.email).toBe(email);
  });

  it("rejects a duplicate email", async () => {
    const res = await request(app)
      .post("/api/waitlist")
      .send({ firstName: "Awa", lastName: "Koné", email });

    expect(res.status).toBe(409);
  });

  it("rejects an invalid email", async () => {
    const res = await request(app)
      .post("/api/waitlist")
      .send({ firstName: "Awa", lastName: "Koné", email: "not-an-email" });

    expect(res.status).toBe(422);
  });
});

describe("GET /api/waitlist/count", () => {
  it("returns the total signup count", async () => {
    const res = await request(app).get("/api/waitlist/count");

    expect(res.status).toBe(200);
    expect(typeof res.body.count).toBe("number");
  });
});
