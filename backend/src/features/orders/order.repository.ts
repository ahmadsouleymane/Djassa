import { prisma } from "../../shared/db/client.js";
import type { Order, OrderStatus, Prisma } from "@prisma/client";

type CreateInput = {
  buyerId: string;
  vendorId: string;
  productId: string;
  chatMessageId?: string;
  checkoutRef: string;
  price: number;
  commissionAmount: number;
  netAmount: number;
  paymentReference: string;
  confirmationCode: string;
};

export class OrderRepository {
  create(data: CreateInput): Promise<Order> {
    return prisma.order.create({ data });
  }

  findById(id: string): Promise<Order | null> {
    return prisma.order.findUnique({ where: { id } });
  }

  findByChatMessageId(chatMessageId: string): Promise<Order | null> {
    return prisma.order.findUnique({ where: { chatMessageId } });
  }

  findByReference(paymentReference: string): Promise<Order | null> {
    return prisma.order.findUnique({ where: { paymentReference } });
  }

  findByCheckoutRef(checkoutRef: string): Promise<Order[]> {
    return prisma.order.findMany({ where: { checkoutRef } });
  }

  updateManyByCheckoutRef(checkoutRef: string, data: Prisma.OrderUpdateManyMutationInput): Promise<Prisma.BatchPayload> {
    return prisma.order.updateMany({ where: { checkoutRef, status: "en_attente_paiement" }, data });
  }

  findByParticipant(userId: string): Promise<Order[]> {
    return prisma.order.findMany({
      where: { OR: [{ buyerId: userId }, { vendorId: userId }] },
      orderBy: { createdAt: "desc" },
    });
  }

  update(id: string, data: Prisma.OrderUpdateInput): Promise<Order> {
    return prisma.order.update({ where: { id }, data });
  }

  updateMany(ids: string[], status: OrderStatus): Promise<Prisma.BatchPayload> {
    return prisma.order.updateMany({ where: { id: { in: ids } }, data: { status } });
  }

  findPastShipDeadline(now: Date): Promise<Order[]> {
    return prisma.order.findMany({
      where: { status: { in: ["en_attente_paiement", "paye"] as OrderStatus[] }, shipBy: { lt: now } },
    });
  }

  findPastConfirmDeadline(now: Date): Promise<Order[]> {
    return prisma.order.findMany({
      where: { status: { in: ["paye", "expedie"] as OrderStatus[] }, confirmBy: { lt: now } },
    });
  }
}
