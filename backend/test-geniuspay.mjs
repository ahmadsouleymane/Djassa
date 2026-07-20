#!/usr/bin/env node
import { createHmac, randomUUID } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim(), v = t.slice(i + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
}

const BASE = process.env.GENIUSPAY_BASE_URL;
const KEY  = process.env.GENIUSPAY_API_KEY;     // sk_sandbox_...
const SEC  = process.env.GENIUSPAY_API_SECRET;   // ss_sandbox_...
const WSEC = process.env.GENIUSPAY_WEBHOOK_SECRET;
const REF  = `test-${randomUUID().slice(0, 8)}`;
const EP   = `${BASE}/payments`;

const BODY = {
  amount: 200,
  currency: "XOF",
  description: `Test Djassa - ${REF}`,
  success_url: "https://djassa.shop/abonnement",
  error_url: "https://djassa.shop",
  metadata: { reference: REF },
};

const sec = (t) => console.log(`\n${"─".repeat(55)}\n${t}\n${"─".repeat(55)}`);
let found = null;

async function tryAuth(name, headers) {
  try {
    const res = await fetch(EP, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", ...headers },
      body: JSON.stringify(BODY),
      signal: AbortSignal.timeout(10000),
    });
    const ct = res.headers.get("content-type") || "";
    const text = await res.text().catch(() => "");
    const isJson = ct.includes("json");

    if (isJson && res.ok) {
      console.log(`  🎉 ${name} → ${res.status} OK !`);
      console.log(`     ${text.slice(0, 400)}`);
      found = { name, text };
    } else if (isJson && (res.status === 422 || res.status === 400)) {
      console.log(`  ⚠️  ${name} → ${res.status} (validation, auth OK)`);
      console.log(`     ${text.slice(0, 300)}`);
      found = { name, text, validationError: true };
    } else if (res.status === 401) {
      console.log(`  ❌ ${name} → 401`);
    } else {
      console.log(`  ❓ ${name} → ${res.status} ${text.slice(0, 100)}`);
    }
  } catch (e) {
    console.log(`  🔴 ${name} → ${e.message}`);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
sec("🔐 TEST DE TOUTES LES MÉTHODES D'AUTH");

const b64 = (s) => Buffer.from(s).toString("base64");

await tryAuth("Bearer (api key = sk_sandbox)",     { Authorization: `Bearer ${KEY}` });
await tryAuth("Bearer (api secret = ss_sandbox)",  { Authorization: `Bearer ${SEC}` });
await tryAuth("X-API-Key: sk_, X-API-Secret: ss_",{ "X-API-Key": KEY, "X-API-Secret": SEC });
await tryAuth("X-API-Key: sk_ (seul)",             { "X-API-Key": KEY });
await tryAuth("X-API-Secret: ss_ (seul)",          { "X-API-Secret": SEC });
await tryAuth("Basic Auth (key:secret)",           { Authorization: `Basic ${b64(KEY+":"+SEC)}` });
await tryAuth("Basic Auth (secret:key)",           { Authorization: `Basic ${b64(SEC+":"+KEY)}` });
await tryAuth("api-key header (sk_)",              { "api-key": KEY, "api-secret": SEC });

// ──────────────────────────────────────────────────────────────────────────────
sec("📋 RÉSULTAT");

if (found) {
  console.log(`\n  ✅ Méthode qui fonctionne : ${found.name}`);
  if (found.validationError) {
    console.log(`  L'auth est bonne mais les champs du body sont peut-être à ajuster.`);
  }
  const data = JSON.parse(found.text);
  if (data.data?.checkout_url || data.data?.payment_url) {
    console.log(`  🎉 URL checkout: ${data.data.checkout_url || data.data.payment_url}`);
  }
} else {
  console.log(`\n  ❌ Aucune méthode d'auth ne passe.`);
}

// HMAC toujours
if (WSEC) {
  sec("🔐 WEBHOOK (curl pour test)");
  const body = JSON.stringify({
    event: "payment.success",
    timestamp: new Date().toISOString(),
    data: {
      transaction: { reference: "MTX-TEST", status: "completed", amount: 200 },
      metadata: { reference: REF },
      environment: "sandbox",
    },
  });
  const sig = createHmac("sha256", WSEC).update(body).digest("hex");
  console.log(`\n  curl -X POST https://djassa-backend-1b0j.onrender.com/api/billing/webhook/geniuspay -H "Content-Type: application/json" -H "X-GeniusPay-Event: payment.success" -H "X-GeniusPay-Signature: ${sig}" -d '${body}'`);
}
