import { describe, it, expect, afterAll } from "vitest";
import { UserRepository } from "./user.repository.js";
import { prisma } from "../../shared/db/client.js";

const repo = new UserRepository();

describe("UserRepository", () => {
  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: "repo-test@djassa.test" } });
    await prisma.$disconnect();
  });

  it("creates and finds a user by email", async () => {
    const created = await repo.create({
      email: "repo-test@djassa.test",
      passwordHash: "hashed",
      accountType: "client",
    });
    expect(created.id).toBeDefined();

    const found = await repo.findByEmail("repo-test@djassa.test");
    expect(found?.id).toBe(created.id);
  });

  it("returns null for unknown email", async () => {
    const found = await repo.findByEmail("nobody@djassa.test");
    expect(found).toBeNull();
  });
});
