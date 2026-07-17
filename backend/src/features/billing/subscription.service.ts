import { randomUUID } from "node:crypto";
import { PaymentRepository } from "./payment.repository.js";
import { UserRepository } from "../users/user.repository.js";
import { NotFoundError } from "../../shared/errors/index.js";
import { PRO_MONTHLY_PRICE, PRO_CYCLE_DAYS } from "../../config/plans.js";
import { createPaymentSession } from "../../services/geniusPay.js";
import { config } from "../../shared/config/index.js";

const paymentRepo = new PaymentRepository();
const userRepo = new UserRepository();

export const SubscriptionService = {
  async checkout(userId: string) {
    const reference = randomUUID();
    await paymentRepo.create({ userId, reference, amount: PRO_MONTHLY_PRICE });
    const { paymentUrl } = await createPaymentSession({
      amount: PRO_MONTHLY_PRICE,
      reference,
      callbackUrl: `${config.apiBaseUrl}/api/billing/webhook/geniuspay`,
      returnUrl: `${config.corsOrigin}/abonnement`,
    });
    return { checkoutUrl: paymentUrl, reference };
  },

  async activate(userId: string) {
    const user = await userRepo.findById(userId);
    if (!user) throw new NotFoundError("Utilisateur");

    const base = user.planPeriodEnd && user.planPeriodEnd > new Date() ? user.planPeriodEnd : new Date();
    const planPeriodEnd = new Date(base.getTime() + PRO_CYCLE_DAYS * 24 * 60 * 60 * 1000);

    return userRepo.update(userId, { planTier: "pro", planPeriodEnd });
  },

  me(userId: string) {
    return userRepo.findById(userId);
  },
};
