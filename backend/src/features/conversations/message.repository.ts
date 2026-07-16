import { prisma } from "../../shared/db/client.js";
import type { ChatMessage } from "@prisma/client";

export class MessageRepository {
  create(data: {
    conversationId: string;
    senderId: string;
    text: string;
    offerPrice?: number | null;
  }): Promise<ChatMessage> {
    return prisma.chatMessage.create({ data });
  }

  findByConversation(conversationId: string): Promise<ChatMessage[]> {
    return prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });
  }

  findById(id: string): Promise<ChatMessage | null> {
    return prisma.chatMessage.findUnique({ where: { id } });
  }
}
