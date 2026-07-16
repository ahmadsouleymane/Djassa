import { createHmac, timingSafeEqual } from "node:crypto";
import { config } from "../shared/config/index.js";

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
