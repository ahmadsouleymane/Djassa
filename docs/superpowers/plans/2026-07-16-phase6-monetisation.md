# Phase 6 — Monétisation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Un vendeur peut souscrire à l'abonnement Pro (3% de commission au lieu de 5%, badge, mise en avant). L'abonnement est prépayé (pas de débit récurrent — GeniusPay ne le permet pas), activé via le même webhook que le paiement de commande.

**Architecture:** `User.plan` (tier + `currentPeriodEnd`), réutilise le webhook GeniusPay de Phase 4 (`billing.controller.ts` route déjà vers `Payment` ou `Order` selon la référence — étendu ici pour router aussi vers l'activation d'abonnement). `OrderService.createFromOffer` (Phase 4) lit désormais `vendor.plan` pour choisir le taux de commission.

**Tech Stack:** Identique, aucune nouvelle dépendance.

## Global Constraints

- Deux paliers seulement : `standard` (gratuit, 5%) / `pro` (abonnement mensuel, 3%). Pas de palier supplémentaire (YAGNI, déjà acté dans le spec).
- L'abonnement est prépayé : `currentPeriodEnd` s'étend depuis la date la plus tardive entre "maintenant" et la fin de période existante (les renouvellements anticipés s'accumulent, ne s'écrasent pas) — même logique que `activateSubscription` dans le projet précédent référencé par le spec.
- Le webhook GeniusPay (Phase 4) doit distinguer un paiement de commande d'un paiement d'abonnement — la référence est cherchée dans un modèle `Payment` (nouveau, dédié aux abonnements) avant de retomber sur `Order` (ou l'inverse) ; ne jamais supposer une seule table.

---

## File Structure

```
backend/
  prisma/schema.prisma          # + PlanTier enum, plan fields on User, model Payment
  src/
    config/plans.ts             # PRO_MONTHLY_PRICE, cycles
    features/
      billing/
        payment.repository.ts
        subscription.service.ts   # checkout + activation
        billing.controller.ts     # (modifié) webhook route vers Payment OU Order
        billing.routes.ts         # (modifié) + POST /api/billing/subscribe, GET /api/billing/me
        subscription.test.ts

frontend/
  src/
    api/billing.ts
    pages/
      Abonnement.tsx
```

---

### Task 1: Modèle Payment (abonnements) + config plans

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Create: `backend/src/config/plans.ts`
- Create: `backend/src/features/billing/payment.repository.ts`
- Test: `backend/src/features/billing/payment.repository.test.ts`

**Interfaces:**
- Produces: `PRO_MONTHLY_PRICE` (FCFA, entier), `PaymentRepository` (`create`, `findByReference`, `markPaid`).

- [ ] **Step 1: Schema**

```prisma
enum PlanTier {
  standard
  pro
}

enum PaymentStatus {
  pending
  paid
}

model Payment {
  id        String        @id @default(uuid())
  userId    String
  user      User          @relation(fields: [userId], references: [id])
  reference String        @unique
  amount    Int
  status    PaymentStatus @default(pending)
  createdAt DateTime      @default(now())
}
```

Add to `User`:
```prisma
  planTier          PlanTier  @default(standard)
  planPeriodEnd     DateTime?
  payments          Payment[]
```

- [ ] **Step 2: Migration**

```bash
cd backend
npx prisma migrate dev --name add_payment_plan
```

- [ ] **Step 3: Config + repository**

`backend/src/config/plans.ts`:

```typescript
export const PRO_MONTHLY_PRICE = 7000; // FCFA
export const PRO_CYCLE_DAYS = 30;
```

`payment.repository.ts` mirrors `order.repository.ts`'s shape: `create({ userId, reference, amount })`, `findByReference(reference)`, `markPaid(id)`.

- [ ] **Step 4: Test, build, commit**

```bash
cd backend
npx vitest run src/features/billing/payment.repository.test.ts
npm run build
git add backend/prisma backend/src/config/plans.ts backend/src/features/billing/payment.repository.ts backend/src/features/billing/payment.repository.test.ts
git commit -m "feat: add Payment model and plan pricing config"
```

---

### Task 2: Souscription Pro + activation via webhook

**Files:**
- Create: `backend/src/features/billing/subscription.service.ts`
- Modify: `backend/src/features/billing/billing.controller.ts` (Phase 4 — webhook route vers Payment ou Order)
- Modify: `backend/src/features/billing/billing.routes.ts` (+ `POST /subscribe`, `GET /me`)
- Modify: `backend/src/app.ts` (si nouvelle route montée séparément — sinon déjà couvert par le router existant)
- Test: `backend/src/features/billing/subscription.test.ts`

**Interfaces:**
- Produces: `SubscriptionService.checkout(userId)` → `{ checkoutUrl, reference }` (mock, même pattern que `OrderService.checkout`). `SubscriptionService.activate(userId)` → étend `planPeriodEnd` depuis `max(now, currentPeriodEnd ?? now)` de `PRO_CYCLE_DAYS` jours, met `planTier: "pro"`.

- [ ] **Step 1: Service**

`subscription.service.ts`:
- `checkout(userId)`: verifies `req.accountType === "vendeur"` (checked in controller via `requireVendor`, already exists from Phase 2), creates a `Payment` with `amount: PRO_MONTHLY_PRICE`, `reference: crypto.randomUUID()`, `status: "pending"`. Returns `{ checkoutUrl: "<mock>", reference }`.
- `activate(userId)`: loads user, computes `base = user.planPeriodEnd && user.planPeriodEnd > now ? user.planPeriodEnd : now`, sets `planPeriodEnd: base + PRO_CYCLE_DAYS days`, `planTier: "pro"`.

- [ ] **Step 2: Webhook dispatch — Payment vs Order**

Modify `billing.controller.ts`'s `webhook` handler (Phase 4): after signature verification, look up the reference in `PaymentRepository.findByReference` first; if found, mark it paid and call `SubscriptionService.activate(payment.userId)`; else fall back to `OrderRepository.findByReference` (existing Phase 4 logic) and call `OrderService.markPaid`. This mirrors the "single shared webhook URL, reference determines routing" pattern from the design spec.

- [ ] **Step 3: Routes**

Add to `billing.routes.ts` (a new authenticated sub-router, or extend the existing one — keep the raw-body webhook route isolated from these JSON routes):

```typescript
billingRouter.post("/subscribe", requireAuth, requireVendor, subscribe);
billingRouter.get("/me", requireAuth, requireVendor, me);
```

`me` returns `{ planTier, planPeriodEnd }` for the current user.

- [ ] **Step 4: Tests**

Cover: non-vendor checkout → 401; vendor checkout → 200 with reference; webhook with that reference and valid signature → user's `planTier` becomes `"pro"`, `planPeriodEnd` set ~30 days out; a second checkout+webhook before expiry → `planPeriodEnd` extends from the *existing* end date, not from `now` (stacking, not overwriting) — this is the one behavior worth a dedicated assertion since it's easy to get backwards.

- [ ] **Step 5: Run tests, build, commit**

```bash
cd backend
npx tsc --noEmit --pretty false
npx vitest run
npm run build
git add backend/src/features/billing backend/src/app.ts
git commit -m "feat: add Pro subscription checkout and stacking activation"
```

---

### Task 3: Commission différenciée (retouche Phase 4)

**Files:**
- Modify: `backend/src/features/orders/order.service.ts`
- Modify: `backend/src/features/orders/order.test.ts`

- [ ] **Step 1: Lire le palier du vendeur à la création de commande**

In `OrderService.createFromOffer`, replace the hardcoded `computeCommission(price, "standard")` with: `const tier = vendor.planTier === "pro" && vendor.planPeriodEnd && vendor.planPeriodEnd > new Date() ? "pro" : "standard";` then `computeCommission(price, tier)` — an expired `planPeriodEnd` silently falls back to standard rate (no separate "expired" state needed, matches the prepaid-block model from the spec).

- [ ] **Step 2: Regression test**

Add a case in `order.test.ts`: a vendor with an active Pro subscription (set up via the same webhook flow, or directly via `prisma.user.update` in test setup for speed) gets `commissionAmount` computed at 3% instead of 5% on a new order.

- [ ] **Step 3: Run tests, build, commit**

```bash
cd backend
npx vitest run
npm run build
git add backend/src/features/orders/order.service.ts backend/src/features/orders/order.test.ts
git commit -m "feat: apply Pro commission rate to eligible vendor orders"
```

---

### Task 4: Frontend — page Abonnement

**Files:**
- Create: `frontend/src/api/billing.ts`
- Create: `frontend/src/pages/Abonnement.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1-2:** `api/billing.ts` mirrors `api/orders.ts`'s shape (`billingApi.checkout()`, `.me()`). `Abonnement.tsx` shows current `planTier`/`planPeriodEnd`, a "Passer Pro" button calling `checkout()` (mock — in the absence of a real GeniusPay redirect, display the returned `checkoutUrl` as a link/text so the flow is visibly complete even though there's no live gateway to redirect to yet).
- [ ] **Step 3: Route** `/abonnement` (protected) in `App.tsx`.
- [ ] **Step 4: Build check**

```bash
cd frontend
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/api/billing.ts frontend/src/pages/Abonnement.tsx frontend/src/App.tsx
git commit -m "feat: add subscription page"
```

---

## Self-Review Notes

- **Spec coverage:** two-tier commission (5%/3%), prepaid stacking subscription (no recurring debit), shared webhook routing by reference — all directly from the approved design spec.
- **Placeholder scan:** the "no live GeniusPay redirect" limitation is the same documented, deliberate gap as Cloudinary/GeniusPay elsewhere in this project (fake credentials, real signing/business logic, network call is a pre-deploy task) — not a TODO.
- **Type consistency:** `planTier`/`planPeriodEnd` naming consistent between Prisma schema, `SubscriptionService`, and `frontend/src/api/billing.ts`.
- **Ownership scoping:** subscription checkout/status scoped to `req.userId`; commission calc reads the *vendor's* plan (not the buyer's), matching who actually pays for Pro.