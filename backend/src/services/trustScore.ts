import { prisma } from "../shared/db/client.js";

export async function computeTrustScore(vendorId: string) {
  const [user, orders, conversations, reviewCount] = await Promise.all([
    prisma.user.findUnique({ where: { id: vendorId } }),
    prisma.order.findMany({ where: { vendorId } }),
    prisma.conversation.findMany({ where: { vendorId }, include: { messages: true } }),
    prisma.review.count({ where: { vendorId } }),
  ]);

  if (!user) {
    return { score: 0, disputeRate: 0, lateShipRate: 0, accountAgeDays: 0, responseRate: 0, salesCount: 0, reviewCount: 0 };
  }

  const disputeRate =
    orders.length === 0 ? 0 : orders.filter((o) => o.status === "en_litige" || o.status === "rembourse").length / orders.length;

  const shippedOrders = orders.filter((o) => o.shippedAt !== null);
  const lateShipRate =
    shippedOrders.length === 0
      ? 0
      : shippedOrders.filter((o) => o.shipBy && o.shippedAt! > o.shipBy).length / shippedOrders.length;

  const accountAgeDays = (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24);

  const responseRate =
    conversations.length === 0
      ? 0
      : conversations.filter((c) => c.messages.some((m) => m.senderId === vendorId)).length / conversations.length;

  const salesCount = orders.filter((o) => o.status === "confirme").length;

  const raw = 100 - disputeRate * 40 - lateShipRate * 30 + Math.min(accountAgeDays / 365, 1) * 15 + responseRate * 15;
  const score = Math.max(0, Math.min(100, Math.round(raw)));

  return { score, disputeRate, lateShipRate, accountAgeDays: Math.round(accountAgeDays), responseRate, salesCount, reviewCount };
}
