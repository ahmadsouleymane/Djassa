import { ConversationRepository } from "./conversation.repository.js";
import { MessageRepository } from "./message.repository.js";
import { ProductRepository } from "../products/product.repository.js";
import { UserRepository } from "../users/user.repository.js";
import { NotFoundError, UnauthorizedError, ValidationError } from "../../shared/errors/index.js";
import { emitToUser } from "../../services/realtime.js";
import { sendEmail, nouveauMessageVendeurEmailHtml } from "../../shared/email/index.js";
import { config } from "../../shared/config/index.js";
import type { SendMessageInput } from "./conversation.schema.js";

const conversationRepo = new ConversationRepository();
const messageRepo = new MessageRepository();
const productRepo = new ProductRepository();
const userRepo = new UserRepository();

function assertParticipant(conversation: { buyerId: string; vendorId: string }, userId: string) {
  if (conversation.buyerId !== userId && conversation.vendorId !== userId) {
    throw new UnauthorizedError("Vous ne participez pas à cette conversation");
  }
}

export const ConversationService = {
  async start(buyerId: string, productId: string) {
    const product = await productRepo.findById(productId);
    if (!product) throw new NotFoundError("Produit");
    if (product.vendorId === buyerId) {
      throw new ValidationError({ productId: "Vous ne pouvez pas démarrer une conversation sur votre propre produit" });
    }
    return conversationRepo.findOrCreate(buyerId, product.vendorId, productId);
  },

  listMine(userId: string) {
    return conversationRepo.findByParticipant(userId);
  },

  async listMessages(userId: string, conversationId: string) {
    const conversation = await conversationRepo.findById(conversationId);
    if (!conversation) throw new NotFoundError("Conversation");
    assertParticipant(conversation, userId);
    return messageRepo.findByConversation(conversationId);
  },

  async sendMessage(userId: string, conversationId: string, input: SendMessageInput) {
    const conversation = await conversationRepo.findById(conversationId);
    if (!conversation) throw new NotFoundError("Conversation");
    assertParticipant(conversation, userId);

    const message = await messageRepo.create({
      conversationId,
      senderId: userId,
      text: input.text,
      offerPrice: input.offerPrice ?? null,
    });

    const recipientId = conversation.buyerId === userId ? conversation.vendorId : conversation.buyerId;
    emitToUser(recipientId, "message:new", { conversationId, message });

    // Fallback email si le destinataire est un vendeur hors ligne (fire-and-forget)
    // On n'envoie l'email qu'au vendeur (pas à l'acheteur)
    if (recipientId === conversation.vendorId) {
      const [vendor, product] = await Promise.all([
        userRepo.findById(recipientId),
        productRepo.findById(conversation.productId),
      ]);
      if (vendor && product) {
        sendEmail(
          vendor.email,
          `Nouveau message de client : ${product.title}`,
          nouveauMessageVendeurEmailHtml({
            vendorName: vendor.email.split("@")[0],
            productTitle: product.title,
            productPhotoUrl: product.photos?.[0] ?? null,
            conversationUrl: `${config.frontendUrl}/messagerie/${conversationId}`,
            messagePreview: input.text,
          }),
        );
      }
    }

    return message;
  },
};
