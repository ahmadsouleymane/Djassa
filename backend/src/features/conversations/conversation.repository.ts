import { prisma } from "../../shared/db/client.js";
import type { Conversation } from "@prisma/client";

export class ConversationRepository {
  async findOrCreate(buyerId: string, vendorId: string, productId: string): Promise<Conversation> {
    const existing = await prisma.conversation.findUnique({
      where: { buyerId_vendorId_productId: { buyerId, vendorId, productId } },
    });
    if (existing) return existing;
    return prisma.conversation.create({ data: { buyerId, vendorId, productId } });
  }

  findById(id: string): Promise<Conversation | null> {
    return prisma.conversation.findUnique({ where: { id } });
  }

  findByParticipant(userId: string) {
    return prisma.conversation.findMany({
      where: { OR: [{ buyerId: userId }, { vendorId: userId }] },
      orderBy: { createdAt: "desc" },
      include: {
        product: true,
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
  }
}
