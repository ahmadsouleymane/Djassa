import { randomUUID, randomInt } from "node:crypto";
import { OrderRepository } from "./order.repository.js";
import { MessageRepository } from "../conversations/message.repository.js";
import { ConversationRepository } from "../conversations/conversation.repository.js";
import { UserRepository } from "../users/user.repository.js";
import { ProductRepository } from "../products/product.repository.js";
import { NotFoundError, UnauthorizedError, ValidationError, ConflictError } from "../../shared/errors/index.js";
import { computeCommission, effectiveUnitPrice, MARKETPLACE_SHIP_DEADLINE_HOURS, MARKETPLACE_CONFIRM_DEADLINE_DAYS } from "../../config/marketplace.js";
import { config } from "../../shared/config/index.js";
import { createPaymentSession } from "../../services/geniusPay.js";
import { logger } from "../../shared/logger/index.js";
import { sendEmail, nouvelleCommandeVendeurEmailHtml, commandePayeeVendeurEmailHtml, commandeConfirmeeVendeurEmailHtml, commandePayeeAcheteurEmailHtml, commandeExpedieeAcheteurEmailHtml, commandeRembourseeAcheteurEmailHtml, commandeAutoRembourseeEmailHtml, commandeAutoConfirmeeVendeurEmailHtml, litigeOuvertEmailHtml, litigeResoluVendeurEmailHtml, litigeResoluAcheteurEmailHtml } from "../../shared/email/index.js";

const orderRepo = new OrderRepository();
const messageRepo = new MessageRepository();
const conversationRepo = new ConversationRepository();
const userRepo = new UserRepository();
const productRepo = new ProductRepository();

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

    const paymentReference = randomUUID();
    let order;
    try {
      order = await orderRepo.create({
        buyerId,
        vendorId: conversation.vendorId,
        productId: conversation.productId,
        chatMessageId,
        checkoutRef: paymentReference,
        price: message.offerPrice,
        commissionAmount,
        netAmount,
        paymentReference,
        confirmationCode: String(randomInt(100000, 999999)),
      });
    } catch (err) {
      if (err instanceof Error && "code" in err && err.code === "P2002") {
        throw new ConflictError("Une commande existe déjà pour cette offre");
      }
      throw err;
    }

    // Notifier le vendeur (fire-and-forget)
    const product = await productRepo.findPublicById(conversation.productId);
    if (product && vendor.email) {
      sendEmail(
        vendor.email,
        `Nouvelle commande : ${product.title}`,
        nouvelleCommandeVendeurEmailHtml({
          vendorName: vendor.email.split("@")[0],
          productTitle: product.title,
          productPhotoUrl: product.photos?.[0] ?? null,
          productUrl: `${config.frontendUrl}/article/${product.id}`,
          price: message.offerPrice,
          buyerEmail: (await userRepo.findById(buyerId))?.email ?? "client",
        }),
      );
    }

    return order;
  },

  async createDirectBatch(buyerId: string, items: { productId: string; quantity: number }[]) {
    if (items.length === 0) throw new ValidationError({ items: "Le panier est vide" });

    const checkoutRef = randomUUID();
    const orders = [];
    for (const item of items) {
      const quantity = Math.max(1, Math.min(99, item.quantity));
      const product = await productRepo.findPublicById(item.productId);
      if (!product) throw new NotFoundError("Produit");

      const vendor = await userRepo.findById(product.vendorId);
      if (!vendor) throw new NotFoundError("Vendeur");
      if (vendor.sellerVerificationStatus !== "approuvee") {
        throw new ValidationError({ vendorId: "Ce vendeur n'est pas encore vérifié" });
      }

      // Promo auto + frais de livraison : la commission ne porte que sur la
      // marchandise, le vendeur conserve l'intégralité des frais de livraison.
      const unit = effectiveUnitPrice(product.price, product.discountPercent);
      const goodsSubtotal = unit * quantity;
      const shipping = product.shippingFee ?? 0;
      const linePrice = goodsSubtotal + shipping;
      const isPro = vendor.planTier === "pro" && !!vendor.planPeriodEnd && vendor.planPeriodEnd > new Date();
      const { commissionAmount, netAmount: goodsNet } = computeCommission(goodsSubtotal, isPro ? "pro" : "standard");

      const order = await orderRepo.create({
        buyerId,
        vendorId: product.vendorId,
        productId: product.id,
        quantity,
        checkoutRef,
        price: linePrice,
        commissionAmount,
        netAmount: goodsNet + shipping,
        paymentReference: randomUUID(),
        confirmationCode: String(randomInt(100000, 999999)),
      });
      orders.push(order);
    }

    // Notifier les vendeurs (fire-and-forget)
    const buyer = await userRepo.findById(buyerId);
    const buyerEmail = buyer?.email ?? "client";
    for (const order of orders) {
      const p = await productRepo.findPublicById(order.productId);
      const v = await userRepo.findById(order.vendorId);
      if (p && v?.email) {
        sendEmail(
          v.email,
          `Nouvelle commande : ${p.title}`,
          nouvelleCommandeVendeurEmailHtml({
            vendorName: v.email.split("@")[0],
            productTitle: p.title,
            productPhotoUrl: p.photos?.[0] ?? null,
            productUrl: `${config.frontendUrl}/article/${p.id}`,
            price: order.price,
            quantity: order.quantity,
            buyerEmail,
          }),
        );
      }
    }

    // Tenter de créer une session de paiement GeniusPay    // Si ça échoue, on renvoie l'URL de la page Paiement comme fallback
    try {
      const total = orders.reduce((sum, o) => sum + o.price, 0);
      const { paymentUrl } = await createPaymentSession({
        amount: total,
        reference: checkoutRef,
        returnUrl: `${config.corsOrigin}/commandes?paye=1`,
      });
      return { orders, checkoutUrl: paymentUrl, reference: checkoutRef };
    } catch (err) {
      logger.warn({ err, checkoutRef }, "GeniusPay indisponible, fallback vers page Paiement");
      return { orders, checkoutUrl: `${config.corsOrigin}/paiement/${checkoutRef}`, reference: checkoutRef };
    }
  },

  async getCheckoutSummary(buyerId: string, reference: string) {
    const orders = await orderRepo.findPendingByCheckoutRefForBuyer(reference, buyerId);
    if (orders.length === 0) throw new NotFoundError("Paiement");
    const items = orders.map((o) => ({
      id: o.id,
      title: o.product.title,
      photo: o.product.photos[0] ?? null,
      unitPrice: o.product.price,
      quantity: o.quantity,
      linePrice: o.price,
    }));
    const total = items.reduce((sum, i) => sum + i.linePrice, 0);
    return { reference, items, total };
  },

  async payDirect(buyerId: string, reference: string) {
    const orders = await orderRepo.findPendingByCheckoutRefForBuyer(reference, buyerId);
    if (orders.length === 0) {
      throw new ValidationError({ reference: "Aucun paiement en attente pour cette référence" });
    }
    await orderRepo.markPaidByCheckoutRefForBuyer(reference, buyerId, {
      status: "paye",
      shipBy: hoursFromNow(MARKETPLACE_SHIP_DEADLINE_HOURS),
    });

    // Envoyer les emails post-paiement (même logique que markPaidByCheckoutRef via webhook)
    const shipByStr = hoursFromNow(MARKETPLACE_SHIP_DEADLINE_HOURS).toLocaleDateString("fr-FR", {
      day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
    });
    const buyer = await userRepo.findById(buyerId);
    const buyerName = buyer?.email?.split("@")[0] ?? "acheteur";
    const buyerEmail = buyer?.email;

    for (const order of orders) {
      const p = await productRepo.findPublicById(order.productId);
      const v = await userRepo.findById(order.vendorId);
      const productTitle = p?.title ?? "Article";
      const photo = p?.photos?.[0] ?? null;

      if (buyerEmail) {
        sendEmail(buyerEmail, `Paiement confirmé : ${productTitle}`, commandePayeeAcheteurEmailHtml({
          buyerName,
          productTitle,
          productPhotoUrl: photo,
          productUrl: `${config.frontendUrl}/article/${order.productId}`,
          price: order.price,
          quantity: order.quantity,
          confirmationCode: order.confirmationCode,
        }));
      }

      if (v?.email) {
        sendEmail(v.email, `Paiement confirmé — prépare l'expédition : ${productTitle}`, commandePayeeVendeurEmailHtml({
          vendorName: v.email.split("@")[0],
          productTitle,
          productPhotoUrl: photo,
          productUrl: `${config.frontendUrl}/article/${order.productId}`,
          price: order.price,
          netAmount: order.netAmount,
          commission: order.commissionAmount,
          quantity: order.quantity,
          shipBy: shipByStr,
        }));
      }
    }

    return { paid: orders.length };
  },

  async checkout(buyerId: string, orderId: string) {
    const order = await orderRepo.findById(orderId);
    if (!order) throw new NotFoundError("Commande");
    if (order.buyerId !== buyerId) throw new UnauthorizedError("Cette commande ne vous appartient pas");
    if (order.status !== "en_attente_paiement") {
      throw new ValidationError({ status: "Cette commande n'est plus en attente de paiement" });
    }
    return { checkoutUrl: `${config.corsOrigin}/paiement/${order.checkoutRef}`, reference: order.checkoutRef };
  },

  async markPaidByCheckoutRef(checkoutRef: string) {
    const orders = await orderRepo.findByCheckoutRefWithDetails(checkoutRef);
    if (orders.length === 0) return null;

    await orderRepo.updateManyByCheckoutRef(checkoutRef, {
      status: "paye",
      shipBy: hoursFromNow(MARKETPLACE_SHIP_DEADLINE_HOURS),
    });

    // Notifier acheteur + vendeur pour chaque commande (fire-and-forget)
    const shipByStr = hoursFromNow(MARKETPLACE_SHIP_DEADLINE_HOURS).toLocaleDateString("fr-FR", {
      day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
    });
    for (const order of orders) {
      const buyerEmail = order.buyer?.email;
      const vendorEmail = order.vendor?.email;
      const productTitle = order.product?.title ?? "Article";
      const photo = order.product?.photos?.[0] ?? null;

      if (buyerEmail) {
        sendEmail(
          buyerEmail,
          `Paiement confirmé : ${productTitle}`,
          commandePayeeAcheteurEmailHtml({
            buyerName: buyerEmail.split("@")[0],
            productTitle,
            productPhotoUrl: photo,
            productUrl: `${config.frontendUrl}/article/${order.productId}`,
            price: order.price,
            quantity: order.quantity,
            confirmationCode: order.confirmationCode,
          }),
        );
      }

      if (vendorEmail) {
        sendEmail(
          vendorEmail,
          `Paiement confirmé — prépare l'expédition : ${productTitle}`,
          commandePayeeVendeurEmailHtml({
            vendorName: vendorEmail.split("@")[0],
            productTitle,
            productPhotoUrl: photo,
            productUrl: `${config.frontendUrl}/article/${order.productId}`,
            price: order.price,
            netAmount: order.netAmount,
            commission: order.commissionAmount,
            quantity: order.quantity,
            shipBy: shipByStr,
          }),
        );
      }
    }

    return orders;
  },

  async markShipped(vendorId: string, orderId: string, tracking?: { trackingNumber?: string; carrier?: string }) {
    const order = await orderRepo.findById(orderId);
    if (!order) throw new NotFoundError("Commande");
    if (order.vendorId !== vendorId) throw new UnauthorizedError("Cette commande ne vous appartient pas");
    if (order.status !== "paye") throw new ValidationError({ status: "Cette commande n'est pas prête à être expédiée" });
    const updated = await orderRepo.update(order.id, {
      status: "expedie",
      confirmBy: daysFromNow(MARKETPLACE_CONFIRM_DEADLINE_DAYS),
      shippedAt: new Date(),
      trackingNumber: tracking?.trackingNumber ?? null,
      carrier: tracking?.carrier ?? null,
    });

    // Notifier l'acheteur (fire-and-forget)
    const details = await orderRepo.findByIdWithDetails(orderId);
    if (details) {
      const buyerEmail = details.buyer?.email;
      const productTitle = details.product?.title ?? "Article";
      if (buyerEmail) {
        const confirmByStr = updated.confirmBy
          ? updated.confirmBy.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })
          : undefined;
        sendEmail(
          buyerEmail,
          `Commande expédiée : ${productTitle}`,
          commandeExpedieeAcheteurEmailHtml({
            buyerName: buyerEmail.split("@")[0],
            productTitle,
            productPhotoUrl: details.product?.photos?.[0] ?? null,
            productUrl: `${config.frontendUrl}/article/${order.productId}`,
            price: order.price,
            confirmationCode: order.confirmationCode,
            trackingNumber: tracking?.trackingNumber ?? null,
            carrier: tracking?.carrier ?? null,
            confirmBy: confirmByStr,
          }),
        );
      }
    }

    return updated;
  },

  async confirm(buyerId: string, orderId: string) {
    const order = await orderRepo.findById(orderId);
    if (!order) throw new NotFoundError("Commande");
    if (order.buyerId !== buyerId) throw new UnauthorizedError("Cette commande ne vous appartient pas");
    if (order.status !== "expedie") throw new ValidationError({ status: "Cette commande n'est pas en attente de confirmation" });
    const updated = await orderRepo.update(order.id, { status: "confirme" });

    // Notifier le vendeur (fire-and-forget)
    const details = await orderRepo.findByIdWithDetails(orderId);
    if (details) {
      const vendorEmail = details.vendor?.email;
      const productTitle = details.product?.title ?? "Article";
      if (vendorEmail) {
        sendEmail(
          vendorEmail,
          `Commande confirmée — paiement libéré : ${productTitle}`,
          commandeConfirmeeVendeurEmailHtml({
            vendorName: vendorEmail.split("@")[0],
            productTitle,
            productPhotoUrl: details.product?.photos?.[0] ?? null,
            price: order.price,
            netAmount: order.netAmount,
            commission: order.commissionAmount,
          }),
        );
      }
    }

    return updated;
  },

  async openDispute(userId: string, orderId: string, reason: string) {
    const order = await orderRepo.findById(orderId);
    if (!order) throw new NotFoundError("Commande");
    assertParticipant(order, userId);
    if (order.status !== "paye" && order.status !== "expedie") {
      throw new ValidationError({ status: "Un litige ne peut être ouvert qu'après paiement" });
    }
    const updated = await orderRepo.update(order.id, { status: "en_litige", disputeReason: reason });

    // Notifier les deux parties (fire-and-forget)
    const details = await orderRepo.findByIdWithDetails(orderId);
    if (details) {
      const buyerEmail = details.buyer?.email;
      const vendorEmail = details.vendor?.email;
      const productTitle = details.product?.title ?? "Article";
      const photo = details.product?.photos?.[0] ?? null;

      const html = litigeOuvertEmailHtml({
        recipientName: "",
        productTitle,
        productPhotoUrl: photo,
        price: order.price,
        reason,
      });

      if (buyerEmail) {
        sendEmail(
          buyerEmail,
          `Litige ouvert : ${productTitle}`,
          litigeOuvertEmailHtml({
            recipientName: buyerEmail.split("@")[0],
            productTitle,
            productPhotoUrl: photo,
            price: order.price,
            reason,
          }),
        );
      }

      if (vendorEmail) {
        sendEmail(
          vendorEmail,
          `Litige ouvert sur ta commande : ${productTitle}`,
          litigeOuvertEmailHtml({
            recipientName: vendorEmail.split("@")[0],
            productTitle,
            productPhotoUrl: photo,
            price: order.price,
            reason,
          }),
        );
      }
    }

    return updated;
  },

  async resolveDispute(orderId: string, resolution: "confirme" | "rembourse") {
    const order = await orderRepo.findById(orderId);
    if (!order) throw new NotFoundError("Commande");
    if (order.status !== "en_litige") throw new ValidationError({ status: "Cette commande n'est pas en litige" });
    const updated = await orderRepo.update(order.id, { status: resolution });

    // Notifier la partie concernée (fire-and-forget)
    const details = await orderRepo.findByIdWithDetails(orderId);
    if (details) {
      const productTitle = details.product?.title ?? "Article";
      const photo = details.product?.photos?.[0] ?? null;

      if (resolution === "confirme") {
        const vendorEmail = details.vendor?.email;
        if (vendorEmail) {
          sendEmail(
            vendorEmail,
            `Litige résolu — paiement libéré : ${productTitle}`,
            litigeResoluVendeurEmailHtml({
              vendorName: vendorEmail.split("@")[0],
              productTitle,
              productPhotoUrl: photo,
              netAmount: order.netAmount,
            }),
          );
        }
      } else {
        const buyerEmail = details.buyer?.email;
        if (buyerEmail) {
          sendEmail(
            buyerEmail,
            `Litige résolu — remboursement : ${productTitle}`,
            litigeResoluAcheteurEmailHtml({
              buyerName: buyerEmail.split("@")[0],
              productTitle,
              productPhotoUrl: photo,
              price: order.price,
            }),
          );
        }
      }
    }

    return updated;
  },

  listMine(userId: string) {
    return orderRepo.findByParticipant(userId);
  },

  adminListDisputes() {
    return orderRepo.findDisputes();
  },

  async vendorStats(vendorId: string) {
    const since = daysFromNow(-30);
    const [statusCounts, revenueSeries, topProductsRaw, pendingShipments, averageOrderValue] = await Promise.all([
      orderRepo.countByStatusForVendor(vendorId),
      orderRepo.revenueSeriesForVendor(vendorId, since),
      orderRepo.topProductsForVendor(vendorId, 5),
      orderRepo.pendingShipmentsForVendor(vendorId),
      orderRepo.averageOrderValueForVendor(vendorId),
    ]);

    const topProducts = await Promise.all(
      topProductsRaw.map(async (row) => {
        const product = await productRepo.findById(row.productId);
        return {
          productId: row.productId,
          title: product?.title ?? "Produit supprimé",
          photo: product?.photos?.[0] ?? null,
          revenue: row._sum.netAmount ?? 0,
          unitsSold: row._sum.quantity ?? 0,
          orders: row._count._all,
        };
      }),
    );

    const byStatus = Object.fromEntries(statusCounts.map((r) => [r.status, r._count._all]));
    const totalOrders = statusCounts.reduce((sum, r) => sum + r._count._all, 0);
    const revenue30d = revenueSeries.reduce((sum, r) => sum + Number(r.revenue), 0);

    return {
      totalOrders,
      revenue30d,
      averageOrderValue,
      byStatus,
      revenueSeries: revenueSeries.map((r) => ({
        day: r.day.toISOString().slice(0, 10),
        revenue: Number(r.revenue),
        orders: Number(r.orders),
      })),
      topProducts,
      pendingShipments: pendingShipments.map((o) => ({
        id: o.id,
        productTitle: o.product.title,
        photo: o.product.photos?.[0] ?? null,
        shipBy: o.shipBy,
        price: o.price,
      })),
    };
  },

  async sweepTimeouts(now = new Date()) {
    const pastShip = await orderRepo.findPastShipDeadline(now);
    if (pastShip.length > 0) {
      await orderRepo.updateMany(pastShip.map((o) => o.id), "rembourse");

      // Notifier les acheteurs (fire-and-forget)
      for (const order of pastShip) {
        const details = await orderRepo.findByIdWithDetails(order.id);
        if (details) {
          const buyerEmail = details.buyer?.email;
          const productTitle = details.product?.title ?? "Article";
          if (buyerEmail) {
            sendEmail(
              buyerEmail,
              `Remboursement automatique : ${productTitle}`,
              commandeAutoRembourseeEmailHtml({
                buyerName: buyerEmail.split("@")[0],
                productTitle,
                productPhotoUrl: details.product?.photos?.[0] ?? null,
                price: order.price,
              }),
            );
          }
        }
      }
    }

    const pastConfirm = await orderRepo.findPastConfirmDeadline(now);
    if (pastConfirm.length > 0) {
      await orderRepo.updateMany(pastConfirm.map((o) => o.id), "confirme");

      // Notifier les vendeurs (fire-and-forget)
      for (const order of pastConfirm) {
        const details = await orderRepo.findByIdWithDetails(order.id);
        if (details) {
          const vendorEmail = details.vendor?.email;
          const productTitle = details.product?.title ?? "Article";
          if (vendorEmail) {
            sendEmail(
              vendorEmail,
              `Paiement libéré automatiquement : ${productTitle}`,
              commandeAutoConfirmeeVendeurEmailHtml({
                vendorName: vendorEmail.split("@")[0],
                productTitle,
                productPhotoUrl: details.product?.photos?.[0] ?? null,
                netAmount: order.netAmount,
              }),
            );
          }
        }
      }
    }

    return { refunded: pastShip.length, released: pastConfirm.length };
  },
};
