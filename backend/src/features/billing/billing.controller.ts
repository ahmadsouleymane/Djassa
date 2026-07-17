import type { Request, Response, NextFunction } from "express";
import { verifyWebhookSignature } from "../../services/geniusPay.js";
import { OrderRepository } from "../orders/order.repository.js";
import { OrderService } from "../orders/order.service.js";
import { PaymentRepository } from "./payment.repository.js";
import { SubscriptionService } from "./subscription.service.js";
import { logger } from "../../shared/logger/index.js";

const orderRepo = new OrderRepository();
const paymentRepo = new PaymentRepository();

export async function webhook(req: Request, res: Response) {
  const timestamp = req.header("X-GeniusPay-Timestamp");
  const signature = req.header("X-GeniusPay-Signature");
  const rawBody = (req.body as Buffer).toString("utf8");

  if (!timestamp || !signature || !verifyWebhookSignature(timestamp, rawBody, signature)) {
    return res.status(401).json({ error: "Signature invalide" });
  }

  const payload = JSON.parse(rawBody) as { reference: string; status: string };
  if (payload.status !== "paid") return res.status(200).json({ received: true });

  const payment = await paymentRepo.findByReference(payload.reference);
  if (payment) {
    await paymentRepo.markPaid(payment.id);
    await SubscriptionService.activate(payment.userId);
    return res.status(200).json({ received: true });
  }

  const orders = await orderRepo.findByCheckoutRef(payload.reference);
  if (orders.length > 0) {
    await OrderService.markPaidByCheckoutRef(payload.reference);
    return res.status(200).json({ received: true });
  }

  logger.warn({ reference: payload.reference }, "Webhook GeniusPay: référence introuvable (ni paiement ni commande)");
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
