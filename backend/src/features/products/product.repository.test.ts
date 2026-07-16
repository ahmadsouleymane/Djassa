import { describe, it, expect, afterAll, beforeAll } from "vitest";
import { ProductRepository } from "./product.repository.js";
import { UserRepository } from "../users/user.repository.js";
import { prisma } from "../../shared/db/client.js";

const productRepo = new ProductRepository();
const userRepo = new UserRepository();
let vendorId: string;

describe("ProductRepository", () => {
  beforeAll(async () => {
    const vendor = await userRepo.create({
      email: "product-repo-vendor@djassa.test",
      passwordHash: "hashed",
      accountType: "vendeur",
    });
    vendorId = vendor.id;
  });

  afterAll(async () => {
    await prisma.product.deleteMany({ where: { vendorId } });
    await prisma.user.deleteMany({ where: { id: vendorId } });
    await prisma.$disconnect();
  });

  it("creates a product and finds it by vendor", async () => {
    const created = await productRepo.create({
      vendorId,
      title: "Robe wax",
      description: "Robe en tissu wax, taille M",
      price: 15000,
      category: "mode_beaute",
      photos: ["https://res.cloudinary.com/demo/image/upload/robe.jpg"],
    });
    expect(created.id).toBeDefined();

    const list = await productRepo.findByVendor(vendorId);
    expect(list).toHaveLength(1);
    expect(list[0].title).toBe("Robe wax");
  });

  it("lists public products filtered by category", async () => {
    const results = await productRepo.findPublic({ category: "mode_beaute", limit: 10 });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((p) => p.category === "mode_beaute")).toBe(true);
  });
});
