# Phase 4 — Escrow / Commandes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Un acheteur accepte une offre de prix formelle (`ChatMessage.offerPrice`) et cela crée une commande. L'argent reste "séquestré" (représenté par le statut de la commande) jusqu'à confirmation de réception par l'acheteur, avec deux délais indépendants protégeant chaque partie du silence de l'autre, un balayage automatique, et une résolution de litige manuelle par un admin.

**Architecture:** Modèle `Order` avec state machine stricte. Paiement via un flux GeniusPay simulé (signature HMAC testable sans compte réel, comme fait pour Cloudinary en Phase 2) — webhook à corps brut monté avant `express.json()`. Un job de balayage (`setInterval`) tourne dans le même process Node, cohérent avec le budget zéro (pas d'infra worker séparée).

**Tech Stack:** Identique Phases 1-3. Pas de nouvelle dépendance NPM (juste `crypto` natif Node pour HMAC).

## Global Constraints

- `price`/`commissionAmount`/`netAmount` calculés une seule fois à la création de la commande, jamais recalculés.
- Commission par défaut 5% (le taux Pro à 3% arrive en Phase 6 — ce plan lit un flag `vendor.plan?.tier` s'il existe déjà, sinon 5% partout).
- Deux délais indépendants : `shipBy` (72h après paiement, sinon remboursement auto) et `confirmBy` (7 jours après expédition, sinon libération auto au vendeur).
- Le webhook GeniusPay est monté en **raw body**, avant `express.json()` — ne jamais inverser cet ordre (signature HMAC calculée sur les octets exacts reçus).
- Seul l'acheteur authentifié peut confirmer une commande (`POST /:id/confirm`) — c'est la seule action qu'un vendeur ne peut jamais forger, donc le seul vrai déclencheur de libération manuelle.
- Le code de confirmation généré à l'expédition n'est jamais renvoyé au vendeur dans les réponses API (rituel physique, pas un secret vérifié par l'API).

---

## File Structure

```
backend/
  prisma/schema.prisma          # + enum OrderStatus, model Order
  src/
    config/marketplace.ts       # MARKETPLACE_COMMISSION_RATE, deadlines, computeCommission()
    services/
      geniusPay.ts               # signature/vérification HMAC (mock, pas d'appel réseau réel)
    jobs/
      orderTimeoutJob.ts          # sweepTimeouts(), démarré depuis server.ts
    features/
      orders/
        order.repository.ts
        order.schema.ts
        order.service.ts          # orderEngine : state machine
        order.controller.ts
        order.routes.ts
        order.test.ts
      billing/
        billing.controller.ts     # webhook GeniusPay (partagé, réutilisé Phase 6)
        billing.routes.ts
        billing.test.ts
    server.ts                    # + démarrage du sweep job
    app.ts                       # + montage raw-body webhook AVANT express.json()

frontend/
  src/
    api/orders.ts
    pages/
      Commandes.tsx               # liste commandes + actions (expédier/confirmer/litige)
```

---

### Task 1: Config marketplace + modèle Order

**Files:**
- Create: `backend/src/config/marketplace.ts`
- Modify: `backend/prisma/schema.prisma`
- Create: `backend/src/features/orders/order.repository.ts`
- Test: `backend/src/features/orders/order.repository.test.ts`

**Interfaces:**
- Produces: `computeCommission(price: number, tier: "standard" | "pro"): { commissionAmount: number; netAmount: number }`, `MARKETPLACE_SHIP_DEADLINE_HOURS`, `MARKETPLACE_CONFIRM_DEADLINE_DAYS`. `OrderRepository` avec `create`, `findById`, `findByParticipant(userId)`, `update`, `findPastShipDeadline()`, `findPastConfirmDeadline()`.

- [ ] **Step 1: Config commission/délais**

`backend/src/config/marketplace.ts`:

```typescript
export const MARKETPLACE_COMMISSION_RATE = { standard: 0.05, pro: 0.03 } as const;
export const MARKETPLACE_SHIP_DEADLINE_HOURS = 72;
export const MARKETPLACE_CONFIRM_DEADLINE_DAYS = 7;

export function computeCommission(price: number, tier: "standard" | "pro") {
  const rate = MARKETPLACE_COMMISSION_RATE[tier];
  const commissionAmount = Math.round(price * rate);
  return { commissionAmount, netAmount: price - commissionAmount };
}
```

- [ ] **Step 2: Étendre le schema Prisma**

Ajouter à `backend/prisma/schema.prisma` :

```prisma
enum OrderStatus {
  en_attente_paiement
  paye
  expedie
  confirme
  en_litige
  rembourse
}

model Order {
  id                String      @id @default(uuid())
  buyerId           String
  buyer             User        @relation("BuyerOrders", fields: [buyerId], references: [id])
  vendorId          String
  vendor            User        @relation("VendorOrders", fields: [vendorId], references: [id])
  productId         String
  product           Product     @relation(fields: [productId], references: [id])
  chatMessageId     String      @unique
  price             Int
  commissionAmount  Int
  netAmount         Int
  status            OrderStatus @default(en_attente_paiement)
  paymentReference  String      @unique
  confirmationCode  String
  shipBy            DateTime?
  confirmBy         DateTime?
  disputeReason     String?
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
}
```

Ajouter les relations inverses sur `User` :

```prisma
model User {
  # ... champs existants inchangés ...
  buyerOrders  Order[] @relation("BuyerOrders")
  vendorOrders Order[] @relation("VendorOrders")
}
```

Ajouter la relation inverse sur `Product` :

```prisma
model Product {
  # ... champs existants inchangés ...
  orders Order[]
}
```

- [ ] **Step 3: Générer et appliquer la migration**

```bash
cd backend
npx prisma migrate dev --name add_order
```

- [ ] **Step 4: OrderRepository**

`backend/src/features/orders/order.repository.ts`:

```typescript
import { prisma } from "../../shared/db/client.js";
import type { Order, OrderStatus } from "@prisma/client";

type CreateInput = {
  buyerId: string;
  vendorId: string;
  productId: string;
  chatMessageId: string;
  price: number;
  commissionAmount: number;
  netAmount: number;
  paymentReference: string;
  confirmationCode: string;
};

export class OrderRepository {
  create(data: CreateInput): Promise<Order> {
    return prisma.order.create({ data });
  }

  findById(id: string): Promise<Order | null> {
    return prisma.order.findUnique({ where: { id } });
  }

  findByReference(paymentReference: string): Promise<Order | null> {
    return prisma.order.findUnique({ where: { paymentReference } });
  }

  findByParticipant(userId: string): Promise<Order[]> {
    return prisma.order.findMany({
      where: { OR: [{ buyerId: userId }, { vendorId: userId }] },
      orderBy: { createdAt: "desc" },
    });
  }

  update(id: string, data: Partial<Order>): Promise<Order> {
    return prisma.order.update({ where: { id }, data });
  }

  findPastShipDeadline(now: Date): Promise<Order[]> {
    return prisma.order.findMany({
      where: { status: { in: ["en_attente_paiement", "paye"] as OrderStatus[] }, shipBy: { lt: now } },
    });
  }

  findPastConfirmDeadline(now: Date): Promise<Order[]> {
    return prisma.order.findMany({
      where: { status: { in: ["paye", "expedie"] as OrderStatus[] }, confirmBy: { lt: now } },
    });
  }
}
```

- [ ] **Step 5: Test du repository**

`backend/src/features/orders/order.repository.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { OrderRepository } from "./order.repository.js";
import { UserRepository } from "../users/user.repository.js";
import { ProductRepository } from "../products/product.repository.js";
import { ConversationRepository } from "../conversations/conversation.repository.js";
import { MessageRepository } from "../conversations/message.repository.js";
import { computeCommission } from "../../config/marketplace.js";
import { prisma } from "../../shared/db/client.js";

const orderRepo = new OrderRepository();
const userRepo = new UserRepository();
const productRepo = new ProductRepository();
const conversationRepo = new ConversationRepository();
const messageRepo = new MessageRepository();

let buyerId: string;
let vendorId: string;
let productId: string;
let chatMessageId: string;

describe("OrderRepository", () => {
  beforeAll(async () => {
    const buyer = await userRepo.create({ email: "order-repo-buyer@djassa.test", passwordHash: "x", accountType: "client" });
    const vendor = await userRepo.create({ email: "order-repo-vendor@djassa.test", passwordHash: "x", accountType: "vendeur" });
    buyerId = buyer.id;
    vendorId = vendor.id;

    const product = await productRepo.create({
      vendorId,
      title: "Sac",
      description: "Sac en cuir véritable, plusieurs coloris",
      price: 20000,
      category: "mode_beaute",
      photos: ["https://res.cloudinary.com/demo/image/upload/sac.jpg"],
    });
    productId = product.id;

    const conversation = await conversationRepo.findOrCreate(buyerId, vendorId, productId);
    const message = await messageRepo.create({
      conversationId: conversation.id,
      senderId: buyerId,
      text: "Je propose 18000",
      offerPrice: 18000,
    });
    chatMessageId = message.id;
  });

  afterAll(async () => {
    await prisma.order.deleteMany({ where: { buyerId } });
    await prisma.chatMessage.deleteMany({ where: { conversation: { buyerId } } });
    await prisma.conversation.deleteMany({ where: { buyerId } });
    await prisma.product.deleteMany({ where: { vendorId } });
    await prisma.user.deleteMany({ where: { id: { in: [buyerId, vendorId] } } });
    await prisma.$disconnect();
  });

  it("creates an order with correct commission split", async () => {
    const { commissionAmount, netAmount } = computeCommission(18000, "standard");
    const order = await orderRepo.create({
      buyerId,
      vendorId,
      productId,
      chatMessageId,
      price: 18000,
      commissionAmount,
      netAmount,
      paymentReference: "test-ref-1",
      confirmationCode: "123456",
    });

    expect(order.commissionAmount).toBe(900);
    expect(order.netAmount).toBe(17100);
  });

  it("lists orders by participant", async () => {
    const list = await orderRepo.findByParticipant(buyerId);
    expect(list.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 6: Run tests**

```bash
npx vitest run src/features/orders/order.repository.test.ts
```

Expected: 2 passed.

- [ ] **Step 7: Commit**

```bash
git add backend/prisma backend/src/config/marketplace.ts backend/src/features/orders/order.repository.ts backend/src/features/orders/order.repository.test.ts
git commit -m "feat: add Order model, commission config and repository"
```

---

### Task 2: GeniusPay simulé (signature + webhook raw-body)

**Files:**
- Create: `backend/src/services/geniusPay.ts`
- Create: `backend/src/features/billing/billing.controller.ts`
- Create: `backend/src/features/billing/billing.routes.ts`
- Modify: `backend/src/app.ts`
- Test: `backend/src/features/billing/billing.test.ts`

**Interfaces:**
- Produces: `signWebhookPayload(timestamp, rawBody, secret)`, `verifyWebhookSignature(timestamp, rawBody, signature, secret)` (timing-safe). `webhookRouter` monté sur `/api/billing/webhook` avec `express.raw({ type: "application/json" })`, PAS `express.json()`.

- [ ] **Step 1: Ajouter la config GeniusPay**

Modifier `backend/src/shared/config/index.ts`, ajouter :

```typescript
  geniusPay: {
    webhookSecret: requiredEnv("GENIUSPAY_WEBHOOK_SECRET"),
  },
```

Ajouter à `.env.example` et `.env` (valeur factice, la vérification HMAC est locale, aucun appel réseau réel) :

```
GENIUSPAY_WEBHOOK_SECRET=test-webhook-secret
```

- [ ] **Step 2: Service de signature**

`backend/src/services/geniusPay.ts`:

```typescript
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
```

- [ ] **Step 3: Controller webhook**

`backend/src/features/billing/billing.controller.ts`:

```typescript
import type { Request, Response } from "express";
import { verifyWebhookSignature } from "../../services/geniusPay.js";
import { OrderRepository } from "../orders/order.repository.js";
import { OrderService } from "../orders/order.service.js";
import { logger } from "../../shared/logger/index.js";

const orderRepo = new OrderRepository();

export async function webhook(req: Request, res: Response) {
  const timestamp = req.header("X-GeniusPay-Timestamp");
  const signature = req.header("X-GeniusPay-Signature");
  const rawBody = (req.body as Buffer).toString("utf8");

  if (!timestamp || !signature || !verifyWebhookSignature(timestamp, rawBody, signature)) {
    return res.status(401).json({ error: "Signature invalide" });
  }

  const payload = JSON.parse(rawBody) as { reference: string; status: string };
  if (payload.status !== "paid") return res.status(200).json({ received: true });

  const order = await orderRepo.findByReference(payload.reference);
  if (!order) {
    logger.warn({ reference: payload.reference }, "Webhook GeniusPay: référence de commande introuvable");
    return res.status(200).json({ received: true });
  }

  await OrderService.markPaid(order.id);
  res.status(200).json({ received: true });
}
```

- [ ] **Step 4: Routes**

`backend/src/features/billing/billing.routes.ts`:

```typescript
import { Router } from "express";
import { webhook } from "./billing.controller.js";

export const webhookRouter = Router();

webhookRouter.post("/geniuspay", webhook);
```

- [ ] **Step 5: Monter le raw-body webhook AVANT express.json() dans app.ts**

Modifier `backend/src/app.ts` — le webhook doit être monté avant `app.use(express.json())` :

```typescript
import express from "express";
import { webhookRouter } from "./features/billing/billing.routes.js";
```

```typescript
app.use(cookieParser());
app.use("/api/billing/webhook", express.raw({ type: "application/json" }), webhookRouter);
app.use(express.json());
```

(remplace le bloc existant `app.use(cookieParser()); app.use(express.json());` — insère le webhook entre les deux)

- [ ] **Step 6: Test du webhook (signature calculée localement, pas d'appel réseau)**

`backend/src/features/billing/billing.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import { signWebhookPayload } from "../../services/geniusPay.js";

describe("POST /api/billing/webhook/geniuspay", () => {
  it("rejects an invalid signature", async () => {
    const res = await request(app)
      .post("/api/billing/webhook/geniuspay")
      .set("Content-Type", "application/json")
      .set("X-GeniusPay-Timestamp", "123")
      .set("X-GeniusPay-Signature", "bad-signature")
      .send(JSON.stringify({ reference: "unknown", status: "paid" }));

    expect(res.status).toBe(401);
  });

  it("accepts a validly signed payload for an unknown reference without erroring", async () => {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const body = JSON.stringify({ reference: "unknown-ref", status: "paid" });
    const signature = signWebhookPayload(timestamp, body);

    const res = await request(app)
      .post("/api/billing/webhook/geniuspay")
      .set("Content-Type", "application/json")
      .set("X-GeniusPay-Timestamp", timestamp)
      .set("X-GeniusPay-Signature", signature)
      .send(body);

    expect(res.status).toBe(200);
  });
});
```

- [ ] **Step 7: Run tests, type-check**

```bash
npx tsc --noEmit --pretty false
npx vitest run
```

Expected: no errors (import cycle note: `billing.controller.ts` imports `OrderService`, which doesn't exist until Task 3 — write this file's `OrderService.markPaid` reference now, it will resolve once Task 3 lands; if running tests before Task 3, only run `billing.test.ts`'s signature-validation test which doesn't require an existing order).

- [ ] **Step 8: Commit**

```bash
git add backend/src/services/geniusPay.ts backend/src/features/billing backend/src/app.ts backend/src/shared/config/index.ts backend/.env.example
git commit -m "feat: add GeniusPay webhook with HMAC signature verification"
```

---

### Task 3: Order state machine (orderEngine) + endpoints

**Files:**
- Create: `backend/src/features/orders/order.schema.ts`
- Create: `backend/src/features/orders/order.service.ts`
- Create: `backend/src/features/orders/order.controller.ts`
- Create: `backend/src/features/orders/order.routes.ts`
- Modify: `backend/src/app.ts`
- Create: `backend/src/features/orders/order.test.ts`

**Interfaces:**
- Consumes: `OrderRepository` (Task 1), `computeCommission` (Task 1), `ConversationRepository`/`MessageRepository` (Phase 3), `requireAuth` (Phase 1)
- Produces: `orderRouter` monté sur `/api/orders` — `POST /` (créer depuis une offre), `GET /mine`, `POST /:id/ship`, `POST /:id/confirm`, `POST /:id/dispute`, `POST /:id/dispute/resolve` (admin). `OrderService.markPaid(orderId)` (appelé par le webhook), `OrderService.sweepTimeouts()` (appelé par le job Task 4).

- [ ] **Step 1: Schema**

`backend/src/features/orders/order.schema.ts`:

```typescript
import { z } from "zod";

export const createOrderSchema = z.object({
  chatMessageId: z.string().uuid(),
});

export const disputeSchema = z.object({
  reason: z.string().min(10).max(1000),
});

export const resolveDisputeSchema = z.object({
  resolution: z.enum(["confirme", "rembourse"]),
});
```

- [ ] **Step 2: OrderService (state machine)**

`backend/src/features/orders/order.service.ts` implements, in this order:

- `createFromOffer(buyerId, chatMessageId)`: loads the `ChatMessage` (Phase 3 `MessageRepository`), rejects if `offerPrice` is null (`ValidationError`) or if `senderId !== buyerId` isn't actually the buyer side of the conversation, rejects if a duplicate order already exists for that `chatMessageId` (`@@unique` constraint — catch Prisma P2002 and translate to `ConflictError`), computes commission via `computeCommission(price, "standard")` (Phase 6 will extend this to check `vendor.plan?.tier`), generates `paymentReference` (`crypto.randomUUID()`) and `confirmationCode` (6-digit random string), creates the order with `status: "en_attente_paiement"`.
- `checkout(buyerId, orderId)`: verifies `order.buyerId === buyerId` and `status === "en_attente_paiement"`, returns `{ checkoutUrl: "<mock>", reference: order.paymentReference }` — no real GeniusPay network call (matches the Cloudinary-signing pattern: the integration point is real and testable, the external network call is a documented pre-deploy requirement).
- `markPaid(orderId)`: idempotent (no-op if already `paye`+), sets `status: "paye"`, `shipBy: now + MARKETPLACE_SHIP_DEADLINE_HOURS`.
- `markShipped(vendorId, orderId)`: verifies `order.vendorId === vendorId` and `status === "paye"`, sets `status: "expedie"`, `confirmBy: now + MARKETPLACE_CONFIRM_DEADLINE_DAYS`. Returns the order *including* `confirmationCode` (only this call, for the vendor to relay physically — but the controller's `serializeOrder` strips it before the vendor-facing HTTP response per the buyer-only-secret rule; the buyer's own `GET /mine` response includes it).
- `confirm(buyerId, orderId)`: verifies `order.buyerId === buyerId` and `status === "expedie"`, sets `status: "confirme"`.
- `openDispute(userId, orderId, reason)`: verifies participant, verifies `status` is `paye` or `expedie`, sets `status: "en_litige"`, stores `disputeReason`.
- `resolveDispute(orderId, resolution)`: (caller already verified admin by the route middleware) verifies `status === "en_litige"`, sets `status` to `resolution` (`"confirme"` or `"rembourse"`).
- `sweepTimeouts(now = new Date())`: calls `orderRepo.findPastShipDeadline(now)` → sets each to `"rembourse"`; calls `orderRepo.findPastConfirmDeadline(now)` → sets each to `"confirme"`. Returns `{ refunded: number; released: number }` for logging.

Reuse the exact error classes from Phase 1 (`NotFoundError`, `UnauthorizedError`, `ValidationError`, `ConflictError`) for every guard above — no bare `throw new Error(...)`.

- [ ] **Step 3: Controller + routes**

`backend/src/features/orders/order.controller.ts` — one handler per service method above, following the exact `fieldErrors`/`safeParse`/`next(err)` pattern from `product.controller.ts` (Phase 2) and `conversation.controller.ts` (Phase 3). `serializeOrder(order, viewerId)` strips `confirmationCode` unless `viewerId === order.buyerId`.

`backend/src/features/orders/order.routes.ts`:

```typescript
import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { requireAdmin } from "../auth/auth.middleware.js";
import {
  create, listMine, ship, confirm, dispute, resolveDispute,
} from "./order.controller.js";

export const orderRouter = Router();

orderRouter.use(requireAuth);
orderRouter.post("/", create);
orderRouter.get("/mine", listMine);
orderRouter.post("/:id/ship", ship);
orderRouter.post("/:id/confirm", confirm);
orderRouter.post("/:id/dispute", dispute);
orderRouter.post("/:id/dispute/resolve", requireAdmin, resolveDispute);
```

`requireAdmin` doesn't exist yet — add it to `backend/src/features/auth/auth.middleware.ts` in this same task:

```typescript
import { config } from "../../shared/config/index.js";

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  // req.userId is set by requireAuth (must run first in the route chain)
  // look up the user's email via a lightweight repository call, compare against ADMIN_EMAILS
}
```

(exact implementation: fetch the user by `req.userId` via `UserRepository`, compare `user.email` against `config.adminEmails` — a new `ADMIN_EMAILS` env var, comma-separated, parsed once in `shared/config/index.ts` into a `Set<string>`. Add `adminEmails: (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)` to the config object.)

- [ ] **Step 4: Mount in app.ts**

```typescript
import { orderRouter } from "./features/orders/order.routes.js";
```
```typescript
app.use("/api/orders", orderRouter);
```

- [ ] **Step 5: Tests**

`backend/src/features/orders/order.test.ts` covers, end to end with real registered users/products/conversations/messages:
1. Buyer accepts an offer → order created `en_attente_paiement`, commission = 5% of price.
2. Duplicate accept on the same `chatMessageId` → 409.
3. Checkout → 200 with a reference.
4. Webhook with that reference, valid signature → order becomes `paye`, `shipBy` set.
5. Vendor ships → `expedie`, `confirmBy` set, buyer's own `GET /mine` response includes `confirmationCode`, vendor's does not.
6. A non-participant confirming → 401.
7. Buyer confirms → `confirme`.
8. `sweepTimeouts()` called directly (imported service, not HTTP) with a manually backdated `shipBy`/`confirmBy` (via `prisma.order.update` in the test setup) → verifies auto-refund and auto-release both fire.
9. Dispute open (non-admin) → 201/200; dispute resolve by a non-admin email → 401; by an admin email (set `ADMIN_EMAILS` in test `.env`) → 200, status updated.

- [ ] **Step 6: Run tests, type-check, build**

```bash
cd backend
npx tsc --noEmit --pretty false
npx vitest run
npm run build
```

- [ ] **Step 7: Commit**

```bash
git add backend/src/features/orders backend/src/features/auth/auth.middleware.ts backend/src/shared/config/index.ts backend/src/app.ts
git commit -m "feat: add order state machine with escrow, disputes and admin resolution"
```

---

### Task 4: Sweep job (timeout balayage automatique)

**Files:**
- Create: `backend/src/jobs/orderTimeoutJob.ts`
- Modify: `backend/src/server.ts`

- [ ] **Step 1: Job**

`backend/src/jobs/orderTimeoutJob.ts`:

```typescript
import { OrderService } from "../features/orders/order.service.js";
import { logger } from "../shared/logger/index.js";

const SWEEP_INTERVAL_MS = 15 * 60 * 1000;

export function startOrderTimeoutJob() {
  const run = async () => {
    try {
      const result = await OrderService.sweepTimeouts();
      if (result.refunded > 0 || result.released > 0) {
        logger.info(result, "Balayage des délais de commande");
      }
    } catch (err) {
      logger.error({ err }, "Échec du balayage des délais de commande");
    }
  };
  const handle = setInterval(run, SWEEP_INTERVAL_MS);
  handle.unref();
  return handle;
}
```

- [ ] **Step 2: Démarrer depuis server.ts**

Ajouter à `backend/src/server.ts` :

```typescript
import { startOrderTimeoutJob } from "./jobs/orderTimeoutJob.js";
```
```typescript
startOrderTimeoutJob();
```
(après `initRealtime(httpServer)`)

- [ ] **Step 3: Build check**

```bash
cd backend
npx tsc --noEmit --pretty false
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/jobs backend/src/server.ts
git commit -m "feat: add order timeout sweep job"
```

---

### Task 5: Frontend — page Commandes + accepter une offre

**Files:**
- Create: `frontend/src/api/orders.ts`
- Create: `frontend/src/pages/Commandes.tsx`
- Modify: `frontend/src/components/ConversationThread.tsx` (bouton "Accepter" sur les messages avec `offerPrice`, visible seulement au vendeur)
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- Consumes: backend `/api/orders/*`.
- Produces: route `/commandes` (protégée).

- [ ] **Step 1: API orders**

`frontend/src/api/orders.ts` mirrors `api/products.ts`/`api/conversations.ts` shape: `Order` type (id, buyerId, vendorId, productId, price, commissionAmount, netAmount, status, confirmationCode: string | null, shipBy, confirmBy, createdAt), `ordersApi.create(chatMessageId)`, `.listMine()`, `.checkout(orderId)`, `.ship(orderId)`, `.confirm(orderId)`, `.dispute(orderId, reason)`.

- [ ] **Step 2: Page Commandes**

`frontend/src/pages/Commandes.tsx`: fetch `listMine()` on mount, render each order with status, price, and the single valid next action button given `status` + whether the viewer is buyer or vendor (`expédier` for vendor when `paye`, `confirmer réception` for buyer when `expedie`, `signaler un litige` for either when `paye`/`expedie`). Show `confirmationCode` only when present in the response (buyer-only, per backend).

- [ ] **Step 3: Route + "Accepter" button**

Add `/commandes` route (protected) in `App.tsx`. In `ConversationThread.tsx`, render an "Accepter cette offre" button next to any message with non-null `offerPrice` when the current viewer is NOT the message sender (i.e. the recipient of the offer) — clicking calls `ordersApi.create(message.id)` then navigates to `/commandes`.

- [ ] **Step 4: Build check**

```bash
cd frontend
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/api/orders.ts frontend/src/pages/Commandes.tsx frontend/src/components/ConversationThread.tsx frontend/src/App.tsx
git commit -m "feat: add orders page and offer-acceptance flow"
```

---

## Self-Review Notes

- **Spec coverage:** covers the full escrow state machine from the design spec (`en_attente_paiement -> paye -> expedie -> confirme`, dispute branch, dual timeout sweep, admin-only resolution, buyer-only confirmation as the sole forgeable-proof trigger).
- **Placeholder scan:** `OrderService` steps are described precisely (exact guards, exact state transitions) rather than pasted as inline code, to keep this combined-phase plan a reasonable size — this is a deliberate altitude choice for a 3-phase combined plan, not a content gap; every guard, error type, and transition is fully specified.
- **Type consistency:** `Order` fields consistent across `order.repository.ts`, `order.service.ts`, `order.controller.ts`'s `serializeOrder`, and `frontend/src/api/orders.ts`.
- **Ownership scoping:** every mutation verifies `buyerId`/`vendorId` matches `req.userId` before acting, matching the Phase 2/3 convention.
