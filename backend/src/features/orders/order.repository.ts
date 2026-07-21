import { prisma } from "../../shared/db/client.js";
import type { Order, OrderStatus, Prisma } from "@prisma/client";

type CreateInput = {
  buyerId: string;
  vendorId: string;
  productId: string;
  quantity?: number;
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

  /** Trouve une commande avec les emails buyer/vendor et le titre du produit. */
  findByIdWithDetails(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: {
        buyer: { select: { email: true } },
        vendor: { select: { email: true } },
        product: { select: { title: true, photos: true } },
      },
    });
  }

  /** Trouve toutes les commandes d'un checkoutRef avec les détails. */
  findByCheckoutRefWithDetails(checkoutRef: string) {
    return prisma.order.findMany({
      where: { checkoutRef },
      include: {
        buyer: { select: { email: true } },
        vendor: { select: { email: true } },
        product: { select: { title: true, photos: true } },
      },
    });
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

  findPendingByCheckoutRefForBuyer(checkoutRef: string, buyerId: string) {
    return prisma.order.findMany({
      where: { checkoutRef, buyerId, status: "en_attente_paiement" },
      include: { product: { select: { title: true, photos: true, price: true } } },
      orderBy: { createdAt: "asc" },
    });
  }

  updateManyByCheckoutRef(checkoutRef: string, data: Prisma.OrderUpdateManyMutationInput): Promise<Prisma.BatchPayload> {
    return prisma.order.updateMany({ where: { checkoutRef, status: "en_attente_paiement" }, data });
  }

  markPaidByCheckoutRefForBuyer(checkoutRef: string, buyerId: string, data: Prisma.OrderUpdateManyMutationInput): Promise<Prisma.BatchPayload> {
    return prisma.order.updateMany({
      where: { checkoutRef, buyerId, status: "en_attente_paiement" },
      data,
    });
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

  findDisputes() {
    return prisma.order.findMany({
      where: { status: "en_litige" },
      include: {
        product: { select: { title: true, photos: true } },
        buyer: { select: { id: true, email: true } },
        vendor: { select: { id: true, email: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  countByStatus() {
    return prisma.order.groupBy({ by: ["status"], _count: { _all: true } });
  }

  async sumCommission(since: Date): Promise<number> {
    const result = await prisma.order.aggregate({
      _sum: { commissionAmount: true },
      where: { status: { in: ["paye", "expedie", "confirme"] as OrderStatus[] }, createdAt: { gte: since } },
    });
    return result._sum.commissionAmount ?? 0;
  }

  countByStatusForVendor(vendorId: string) {
    return prisma.order.groupBy({ by: ["status"], where: { vendorId }, _count: { _all: true } });
  }

  async revenueSeriesForVendor(vendorId: string, since: Date): Promise<{ day: Date; revenue: bigint; orders: bigint }[]> {
    return prisma.$queryRaw`
      SELECT date_trunc('day', "createdAt") AS day,
             COALESCE(SUM("netAmount"), 0)::bigint AS revenue,
             COUNT(*)::bigint AS orders
      FROM "Order"
      WHERE "vendorId" = ${vendorId}
        AND "createdAt" >= ${since}
        AND status IN ('paye', 'expedie', 'confirme')
      GROUP BY day
      ORDER BY day ASC
    `;
  }

  async topProductsForVendor(vendorId: string, limit: number) {
    const rows = await prisma.order.groupBy({
      by: ["productId"],
      where: { vendorId, status: { in: ["paye", "expedie", "confirme"] as OrderStatus[] } },
      _sum: { netAmount: true, quantity: true },
      _count: { _all: true },
      orderBy: { _sum: { netAmount: "desc" } },
      take: limit,
    });
    return rows;
  }

  pendingShipmentsForVendor(vendorId: string) {
    return prisma.order.findMany({
      where: { vendorId, status: "paye" },
      include: { product: { select: { title: true, photos: true } } },
      orderBy: { shipBy: "asc" },
    });
  }

  async averageOrderValueForVendor(vendorId: string): Promise<number> {
    const result = await prisma.order.aggregate({
      _avg: { netAmount: true },
      where: { vendorId, status: { in: ["paye", "expedie", "confirme"] as OrderStatus[] } },
    });
    return Math.round(result._avg.netAmount ?? 0);
  }
}
