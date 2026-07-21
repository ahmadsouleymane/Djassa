import { Resend } from "resend";
import { config } from "../config/index.js";
import { logger } from "../logger/index.js";

let client: Resend | null = null;

function getClient(): Resend | null {
  if (!config.resend.apiKey) return null;
  if (!client) client = new Resend(config.resend.apiKey);
  return client;
}

export async function sendEmail(to: string | string[], subject: string, html: string): Promise<boolean> {
  const resend = getClient();
  if (!resend) {
    logger.warn({ to, subject }, "RESEND_API_KEY absent : email non envoyé (no-op)");
    return false;
  }

  try {
    await resend.emails.send({ from: config.resend.fromEmail, to, subject, html });
    return true;
  } catch (err) {
    logger.error({ err, to, subject }, "Échec de l'envoi d'email via Resend");
    return false;
  }
}

// Ré-exporter les templates depuis le module dédié
export {
  welcomeEmailHtml,
  passwordResetEmailHtml,
  passwordChangedEmailHtml,
  nouvelleCommandeVendeurEmailHtml,
  commandePayeeVendeurEmailHtml,
  commandeConfirmeeVendeurEmailHtml,
  commandePayeeAcheteurEmailHtml,
  commandeExpedieeAcheteurEmailHtml,
  commandeRembourseeAcheteurEmailHtml,
  commandeAutoRembourseeEmailHtml,
  commandeAutoConfirmeeVendeurEmailHtml,
  litigeOuvertEmailHtml,
  litigeResoluVendeurEmailHtml,
  litigeResoluAcheteurEmailHtml,
  kycSoumisAdminEmailHtml,
  kycApprouveVendeurEmailHtml,
  kycRejeteVendeurEmailHtml,
  abonnementProActiveEmailHtml,
  nouvelAvisVendeurEmailHtml,
  waitlistConfirmationEmailHtml,
  signalementRecuAdminEmailHtml,
  signalementResoluEmailHtml,
  nouveauMessageVendeurEmailHtml,
} from "./templates.js";
