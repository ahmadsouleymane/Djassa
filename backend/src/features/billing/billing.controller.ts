import type { Request, Response, NextFunction } from "express";
import { verifyWebhookSignature } from "../../services/geniusPay.js";
import { OrderRepository } from "../orders/order.repository.js";
import { OrderService } from "../orders/order.service.js";
import { PaymentRepository } from "./payment.repository.js";
import { SubscriptionService } from "./subscription.service.js";
import { logger } from "../../shared/logger/index.js";

const orderRepo = new OrderRepository();
const paymentRepo = new PaymentRepository();

type GeniusPayWebhook = {
  event: string;
  timestamp: string;
  data: {
    transaction?: {
      reference?: string;
      status?: string;
      metadata?: { reference?: string };
    };
    metadata?: { reference?: string };
  };
};

export async function webhook(req: Request, res: Response) {
  const signature = req.header("X-GeniusPay-Signature");
  const rawBody = (req.body as Buffer).toString("utf8");

  if (!signature || !verifyWebhookSignature(rawBody, signature)) {
    return res.status(401).json({ error: "Signature invalide" });
  }

  const payload = JSON.parse(rawBody) as GeniusPayWebhook;

  // Ne traiter que les paiements réussis
  // On ignore X-GeniusPay-Event (non signé HMAC) et on se fie uniquement au body.
  if (payload.event !== "payment.success") {
    return res.status(200).json({ received: true });
  }

  // Récupérer notre référence depuis les métadonnées
  const ourRef = payload.data?.metadata?.reference
              ?? payload.data?.transaction?.metadata?.reference;
  if (!ourRef) {
    logger.warn("Webhook GeniusPay: pas de référence métadonnée");
    return res.status(200).json({ received: true });
  }

  // Chercher d'abord un paiement d'abonnement
  const payment = await paymentRepo.findByReference(ourRef);
  if (payment) {
    // Éviter la double activation si le fallback sync() a déjà traité ce paiement
    if (payment.status !== "paid") {
      await paymentRepo.markPaid(payment.id);
      await SubscriptionService.activate(payment.userId);
    }
    return res.status(200).json({ received: true });
  }

  // Ensuite chercher une commande
  const orders = await orderRepo.findByCheckoutRef(ourRef);
  if (orders.length > 0) {
    await OrderService.markPaidByCheckoutRef(ourRef);
    return res.status(200).json({ received: true });
  }

  logger.warn({ reference: ourRef }, "Webhook GeniusPay: référence introuvable");
  res.status(200).json({ received: true });
}

export async function subscribe(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await SubscriptionService.checkout(req.userId!);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await SubscriptionService.me(req.userId!);
    res.json({ planTier: user?.planTier, planPeriodEnd: user?.planPeriodEnd });
  } catch (err) {
    next(err);
  }
}

export async function syncPlan(req: Request, res: Response, next: NextFunction) {
  try {
    const { reference } = req.body as { reference?: string };
    if (!reference) return res.status(400).json({ error: "Référence manquante" });
    const updated = await SubscriptionService.sync(req.userId!, reference);
    if (!updated) return res.json({ synced: false });
    res.json({ synced: true, planTier: updated.planTier, planPeriodEnd: updated.planPeriodEnd });
  } catch (err) {
    next(err);
  }
}
