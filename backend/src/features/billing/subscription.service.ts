import { randomUUID } from "node:crypto";
import { PaymentRepository } from "./payment.repository.js";
import { UserRepository } from "../users/user.repository.js";
import { NotFoundError } from "../../shared/errors/index.js";
import { PRO_MONTHLY_PRICE, PRO_CYCLE_DAYS } from "../../config/plans.js";
import { createPaymentSession } from "../../services/geniusPay.js";
import { config } from "../../shared/config/index.js";
import { sendEmail, abonnementProActiveEmailHtml } from "../../shared/email/index.js";

const paymentRepo = new PaymentRepository();
const userRepo = new UserRepository();

export const SubscriptionService = {
  async checkout(userId: string) {
    const reference = randomUUID();
    await paymentRepo.create({ userId, reference, amount: PRO_MONTHLY_PRICE });
    const { paymentUrl } = await createPaymentSession({
      amount: PRO_MONTHLY_PRICE,
      reference,
      returnUrl: `${config.corsOrigin}/abonnement?ref=${reference}`,
    });
    return { checkoutUrl: paymentUrl, reference };
  },

  async activate(userId: string) {
    const user = await userRepo.findById(userId);
    if (!user) throw new NotFoundError("Utilisateur");

    const base = user.planPeriodEnd && user.planPeriodEnd > new Date() ? user.planPeriodEnd : new Date();
    const planPeriodEnd = new Date(base.getTime() + PRO_CYCLE_DAYS * 24 * 60 * 60 * 1000);

    const updated = await userRepo.update(userId, { planTier: "pro", planPeriodEnd });

    // Email de confirmation (fire-and-forget)
    sendEmail(
      user.email,
      "Abonnement Pro activé !",
      abonnementProActiveEmailHtml({
        vendorName: user.email.split("@")[0],
        planPeriodEnd: planPeriodEnd.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }),
      }),
    );

    return updated;
  },

  /** Fallback quand le webhook GeniusPay n'arrive pas : vérifie que le paiement
   *  correspondant à la référence existe bien avant d'activer l'abonnement. */
  async sync(userId: string, reference: string) {
    const pendingPayment = await paymentRepo.findPendingByUserAndReference(userId, reference);
    if (!pendingPayment) return null;

    await paymentRepo.markPaid(pendingPayment.id);
    return this.activate(userId);
  },

  me(userId: string) {
    return userRepo.findById(userId);
  },
};
