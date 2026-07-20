import { createHmac, timingSafeEqual } from "node:crypto";
import { config } from "../shared/config/index.js";
import { logger } from "../shared/logger/index.js";

type CreatePaymentSessionInput = {
  amount: number;
  reference: string;
  returnUrl: string;
};

// Doc: POST /api/v1/merchant/payments
// Auth: X-API-Key + X-API-Secret
// Réponse: { success, data: { checkout_url, payment_url, reference } }
// Montant minimum: 200 XOF
export async function createPaymentSession(input: CreatePaymentSessionInput): Promise<{ paymentUrl: string; reference: string }> {
  const res = await fetch(`${config.geniusPay.baseUrl}/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-API-Key": config.geniusPay.apiKey,
      "X-API-Secret": config.geniusPay.apiSecret,
    },
    body: JSON.stringify({
      amount: input.amount,
      currency: "XOF",
      description: `Paiement Djassa - ${input.reference}`,
      success_url: input.returnUrl,
      error_url: input.returnUrl,
      metadata: { reference: input.reference },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    logger.error({ status: res.status, body }, "GeniusPay: échec de création de session de paiement");
    throw new Error("Impossible d'initier le paiement GeniusPay");
  }

  const json = (await res.json()) as { success: boolean; data?: { checkout_url?: string; payment_url?: string; reference?: string } };
  const paymentUrl = json.data?.checkout_url ?? json.data?.payment_url;
  const gpReference = json.data?.reference ?? "";

  if (!paymentUrl) {
    logger.error({ response: json }, "GeniusPay: réponse sans URL de paiement");
    throw new Error("Réponse GeniusPay invalide");
  }

  return { paymentUrl, reference: gpReference };
}

// Doc: HMAC-SHA256 du corps brut (pas de timestamp)
export function signWebhookPayload(rawBody: string): string {
  return createHmac("sha256", config.geniusPay.webhookSecret).update(rawBody).digest("hex");
}

export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const expected = signWebhookPayload(rawBody);
  const expectedBuf = Buffer.from(expected, "hex");
  const receivedBuf = Buffer.from(signature, "hex");
  if (expectedBuf.length !== receivedBuf.length) return false;
  return timingSafeEqual(expectedBuf, receivedBuf);
}
