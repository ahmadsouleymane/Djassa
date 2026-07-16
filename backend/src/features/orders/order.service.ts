import { randomUUID, randomInt } from "node:crypto";
import { OrderRepository } from "./order.repository.js";
import { MessageRepository } from "../conversations/message.repository.js";
import { ConversationRepository } from "../conversations/conversation.repository.js";
import { UserRepository } from "../users/user.repository.js";
import { NotFoundError, UnauthorizedError, ValidationError, ConflictError } from "../../shared/errors/index.js";
import { computeCommission, MARKETPLACE_SHIP_DEADLINE_HOURS, MARKETPLACE_CONFIRM_DEADLINE_DAYS } from "../../config/marketplace.js";

const orderRepo = new OrderRepository();
const messageRepo = new MessageRepository();
const conversationRepo = new ConversationRepository();
const userRepo = new UserRepository();

function hoursFromNow(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function assertParticipant(order: { buyerId: string; vendorId: string }, userId: string) {
  if (order.buyerId !== userId && order.vendorId !== userId) {
    throw new UnauthorizedError("Vous ne participez pas à cette commande");
  }
}

export const OrderService = {
  async createFromOffer(buyerId: string, chatMessageId: string) {
    const message = await messageRepo.findById(chatMessageId);
    if (!message) throw new NotFoundError("Offre");
    if (message.offerPrice === null) throw new ValidationError({ chatMessageId: "Ce message ne contient pas d'offre de prix" });

    const conversation = await conversationRepo.findById(message.conversationId);
    if (!conversation) throw new NotFoundError("Conversation");
    if (conversation.buyerId !== buyerId) {
      throw new UnauthorizedError("Seul l'acheteur de la conversation peut accepter une offre");
    }

    const vendor = await userRepo.findById(conversation.vendorId);
    if (!vendor) throw new NotFoundError("Vendeur");
    if (vendor.sellerVerificationStatus !== "approuvee") {
      throw new ValidationError({ vendorId: "Ce vendeur n'est pas encore vérifié" });
    }

    const isPro = vendor.planTier === "pro" && !!vendor.planPeriodEnd && vendor.planPeriodEnd > new Date();
    const { commissionAmount, netAmount } = computeCommission(message.offerPrice, isPro ? "pro" : "standard");

    try {
      return await orderRepo.create({
        buyerId,
        vendorId: conversation.vendorId,
        productId: conversation.productId,
        chatMessageId,
        price: message.offerPrice,
        commissionAmount,
        netAmount,
        paymentReference: randomUUID(),
        confirmationCode: String(randomInt(100000, 999999)),
      });
    } catch (err) {
      if (err instanceof Error && "code" in err && err.code === "P2002") {
        throw new ConflictError("Une commande existe déjà pour cette offre");
      }
      throw err;
    }
  },

  async checkout(buyerId: string, orderId: string) {
    const order = await orderRepo.findById(orderId);
    if (!order) throw new NotFoundError("Commande");
    if (order.buyerId !== buyerId) throw new UnauthorizedError("Cette commande ne vous appartient pas");
    if (order.status !== "en_attente_paiement") {
      throw new ValidationError({ status: "Cette commande n'est plus en attente de paiement" });
    }
    return { checkoutUrl: `https://checkout.geniuspay.mock/${order.paymentReference}`, reference: order.paymentReference };
  },

  async markPaid(orderId: string) {
    const order = await orderRepo.findById(orderId);
    if (!order) throw new NotFoundError("Commande");
    if (order.status !== "en_attente_paiement") return order;
    return orderRepo.update(order.id, { status: "paye", shipBy: hoursFromNow(MARKETPLACE_SHIP_DEADLINE_HOURS) });
  },

  async markShipped(vendorId: string, orderId: string) {
    const order = await orderRepo.findById(orderId);
    if (!order) throw new NotFoundError("Commande");
    if (order.vendorId !== vendorId) throw new UnauthorizedError("Cette commande ne vous appartient pas");
    if (order.status !== "paye") throw new ValidationError({ status: "Cette commande n'est pas prête à être expédiée" });
    return orderRepo.update(order.id, {
      status: "expedie",
      confirmBy: daysFromNow(MARKETPLACE_CONFIRM_DEADLINE_DAYS),
      shippedAt: new Date(),
    });
  },

  async confirm(buyerId: string, orderId: string) {
    const order = await orderRepo.findById(orderId);
    if (!order) throw new NotFoundError("Commande");
    if (order.buyerId !== buyerId) throw new UnauthorizedError("Cette commande ne vous appartient pas");
    if (order.status !== "expedie") throw new ValidationError({ status: "Cette commande n'est pas en attente de confirmation" });
    return orderRepo.update(order.id, { status: "confirme" });
  },

  async openDispute(userId: string, orderId: string, reason: string) {
    const order = await orderRepo.findById(orderId);
    if (!order) throw new NotFoundError("Commande");
    assertParticipant(order, userId);
    if (order.status !== "paye" && order.status !== "expedie") {
      throw new ValidationError({ status: "Un litige ne peut être ouvert qu'après paiement" });
    }
    return orderRepo.update(order.id, { status: "en_litige", disputeReason: reason });
  },

  async resolveDispute(orderId: string, resolution: "confirme" | "rembourse") {
    const order = await orderRepo.findById(orderId);
    if (!order) throw new NotFoundError("Commande");
    if (order.status !== "en_litige") throw new ValidationError({ status: "Cette commande n'est pas en litige" });
    return orderRepo.update(order.id, { status: resolution });
  },

  listMine(userId: string) {
    return orderRepo.findByParticipant(userId);
  },

  async sweepTimeouts(now = new Date()) {
    const pastShip = await orderRepo.findPastShipDeadline(now);
    if (pastShip.length > 0) await orderRepo.updateMany(pastShip.map((o) => o.id), "rembourse");

    const pastConfirm = await orderRepo.findPastConfirmDeadline(now);
    if (pastConfirm.length > 0) await orderRepo.updateMany(pastConfirm.map((o) => o.id), "confirme");

    return { refunded: pastShip.length, released: pastConfirm.length };
  },
};
