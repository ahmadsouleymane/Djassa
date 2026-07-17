import { createHmac, timingSafeEqual } from "node:crypto";
import { config } from "../shared/config/index.js";
import { logger } from "../shared/logger/index.js";

type CreatePaymentSessionInput = {
  amount: number;
  reference: string;
  callbackUrl: string;
  returnUrl: string;
};

// Endpoint path/payload shape not yet confirmed against GeniusPay's real API docs
// (pay.genius.ci/docs/api was behind a bot-check wall when this was written) —
// adjust path/fields/response key/auth scheme here once the real contract is available.
export async function createPaymentSession(input: CreatePaymentSessionInput): Promise<{ paymentUrl: string }> {
  const basicAuth = Buffer.from(`${config.geniusPay.apiKey}:${config.geniusPay.apiSecret}`).toString("base64");
  const res = await fetch(`${config.geniusPay.baseUrl}/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${basicAuth}`,
    },
    body: JSON.stringify({
      amount: input.amount,
      currency: "XOF",
      reference: input.reference,
      callback_url: input.callbackUrl,
      return_url: input.returnUrl,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    logger.error({ status: res.status, body }, "GeniusPay: échec de création de session de paiement");
    throw new Error("Impossible d'initier le paiement GeniusPay");
  }

  const data = (await res.json()) as { paymentUrl?: string; payment_url?: string };
  const paymentUrl = data.paymentUrl ?? data.payment_url;
  if (!paymentUrl) {
    logger.error({ data }, "GeniusPay: réponse sans URL de paiement");
    throw new Error("Réponse GeniusPay invalide");
  }
  return { paymentUrl };
}

export function signWebhookPayload(timestamp: string, rawBody: string): string {
  return createHmac("sha256", config.geniusPay.webhookSecret).update(`${timestamp}.${rawBody}`).digest("hex");
}

export function verifyWebhookSignature(timestamp: string, rawBody: string, signature: string): boolean {
  const expected = signWebhookPayload(timestamp, rawBody);
  const expectedBuf = Buffer.from(expected, "hex");
  const receivedBuf = Buffer.from(signature, "hex");
  if (expectedBuf.length !== receivedBuf.length) return false;
  return timingSafeEqual(expectedBuf, receivedBuf);
}
