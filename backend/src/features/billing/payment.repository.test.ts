import { describe, it, expect, afterAll } from "vitest";
import { PaymentRepository } from "./payment.repository.js";
import { UserRepository } from "../users/user.repository.js";
import { prisma } from "../../shared/db/client.js";

const paymentRepo = new PaymentRepository();
const userRepo = new UserRepository();

describe("PaymentRepository", () => {
  const email = "payment-repo@djassa.test";

  afterAll(async () => {
    await prisma.payment.deleteMany({ where: { user: { email } } });
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  it("creates a payment and marks it paid", async () => {
    const user = await userRepo.create({ email, passwordHash: "x", accountType: "vendeur" });
    const payment = await paymentRepo.create({ userId: user.id, reference: "pay-ref-1", amount: 7000 });
    expect(payment.status).toBe("pending");

    const paid = await paymentRepo.markPaid(payment.id);
    expect(paid.status).toBe("paid");

    const found = await paymentRepo.findByReference("pay-ref-1");
    expect(found?.id).toBe(payment.id);
  });
});
