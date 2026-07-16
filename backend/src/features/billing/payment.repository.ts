import { prisma } from "../../shared/db/client.js";
import type { Payment } from "@prisma/client";

export class PaymentRepository {
  create(data: { userId: string; reference: string; amount: number }): Promise<Payment> {
    return prisma.payment.create({ data });
  }

  findByReference(reference: string): Promise<Payment | null> {
    return prisma.payment.findUnique({ where: { reference } });
  }

  markPaid(id: string): Promise<Payment> {
    return prisma.payment.update({ where: { id }, data: { status: "paid" } });
  }
}
