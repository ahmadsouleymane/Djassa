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

export function passwordResetEmailHtml(resetUrl: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color:#00c266;">Réinitialisation de mot de passe</h2>
      <p>Tu as demandé à réinitialiser ton mot de passe Djassa. Ce lien est valable 1 heure.</p>
      <p><a href="${resetUrl}" style="display:inline-block;padding:12px 20px;background:#00c266;color:#fff;border-radius:8px;text-decoration:none;">Réinitialiser mon mot de passe</a></p>
      <p style="color:#888;font-size:13px;">Si tu n'es pas à l'origine de cette demande, ignore cet email.</p>
    </div>
  `;
}
