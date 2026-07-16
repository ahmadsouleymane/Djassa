# Phase 5 — Confiance / Vérification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Un vendeur soumet une pièce d'identité, un admin l'approuve ou la rejette ; seuls les vendeurs approuvés peuvent recevoir des commandes et apparaître dans le flux public. Après une commande confirmée, l'acheteur laisse un avis. Un score de confiance composite (affichage seul) est calculé à partir de signaux réels.

**Architecture:** Ajoute `sellerVerification` (embedded JSON-like fields sur `User`) + modèle `Review`. Réutilise l'upload signé Cloudinary (Phase 2) pour la pièce d'identité. Modifie rétroactivement `ProductService`/`OrderService`/`public.routes.ts` (Phases 2 et 4) pour appliquer la porte "vendeur vérifié".

**Tech Stack:** Identique aux phases précédentes, aucune nouvelle dépendance.

## Global Constraints

- Un vendeur `non_soumise`/`en_attente`/`rejetee` peut toujours gérer son catalogue privé (`GET/POST/PATCH/DELETE /api/products*`), mais ne peut ni apparaître dans `/api/public/products` ni recevoir de commande (`POST /api/orders`) tant que non `approuvee`.
- Un avis (`Review`) n'est créable que si la commande liée est `confirme` et que l'auteur en est bien l'acheteur — un seul avis par commande (`@@unique` sur `orderId`).
- Le score de confiance est **affichage seul** en V1 — ne modifie aucun délai ni aucune autorisation automatiquement (choix déjà acté dans le spec produit).
- `requireAdmin` (créé en Phase 4) est réutilisé tel quel pour toutes les routes admin de cette phase.

---

## File Structure

```
backend/
  prisma/schema.prisma          # + sellerVerification fields on User, model Review
  src/
    features/
      verification/
        verification.schema.ts
        verification.service.ts
        verification.controller.ts
        verification.routes.ts    # /api/verification (soumission) + /api/verification/admin/*
        verification.test.ts
      reviews/
        review.repository.ts
        review.schema.ts
        review.service.ts
        review.controller.ts
        review.routes.ts          # /api/reviews (créer) + /api/public/vendors/:id/reviews
        review.test.ts
    services/
      trustScore.ts               # calcul composite, exposé via /api/public/vendors/:id/trust-score

frontend/
  src/
    pages/
      Verification.tsx             # vendeur : upload pièce identité + statut
      Admin/
        Verifications.tsx           # admin : liste en_attente, approuver/rejeter
    components/
      ReviewForm.tsx
      TrustBadge.tsx
```

---

### Task 1: Vérification vendeur (modèle + soumission + admin)

**Files:**
- Modify: `backend/prisma/schema.prisma` (User + `SellerVerificationStatus` enum)
- Create: `backend/src/features/verification/verification.schema.ts`
- Create: `backend/src/features/verification/verification.service.ts`
- Create: `backend/src/features/verification/verification.controller.ts`
- Create: `backend/src/features/verification/verification.routes.ts`
- Modify: `backend/src/app.ts`
- Test: `backend/src/features/verification/verification.test.ts`

**Interfaces:**
- Produces: `User.isVerifiedSeller(): boolean` — helper computed from `sellerVerificationStatus === "approuvee"`, used by Task 3 of this plan and by the retroactive Order gate. `verificationRouter` on `/api/verification` — `POST /submit` (vendeur, body `{ documentUrl }` from an already-signed Cloudinary upload), `GET /status`, `GET /admin/pending` (admin), `POST /admin/:userId/approve` (admin), `POST /admin/:userId/reject` (admin, body `{ reason }`).

- [ ] **Step 1: Schema**

Add to `User` in `backend/prisma/schema.prisma`:

```prisma
enum SellerVerificationStatus {
  non_soumise
  en_attente
  approuvee
  rejetee
}
```

Add fields to `model User`:
```prisma
  sellerVerificationStatus SellerVerificationStatus @default(non_soumise)
  sellerVerificationDocUrl String?
  sellerVerificationReason String?
```

- [ ] **Step 2: Migration**

```bash
cd backend
npx prisma migrate dev --name add_seller_verification
```

- [ ] **Step 3: Schema/service/controller/routes**

`verification.schema.ts`: `submitSchema = z.object({ documentUrl: z.string().url() })`, `rejectSchema = z.object({ reason: z.string().min(5).max(500) })`.

`verification.service.ts` (`VerificationService`, using `UserRepository` — add `updateVerification(userId, data)` method to `UserRepository` in this same task if not already flexible enough):
- `submit(userId, documentUrl)`: sets `sellerVerificationStatus: "en_attente"`, `sellerVerificationDocUrl: documentUrl`, `sellerVerificationReason: null`.
- `status(userId)`: returns current verification fields for that user.
- `listPending()`: `UserRepository.findByVerificationStatus("en_attente")` (new repository method).
- `approve(userId)`: sets `"approuvee"`.
- `reject(userId, reason)`: sets `"rejetee"`, stores `reason`.

`verification.controller.ts` + `verification.routes.ts` follow the exact `requireAuth`/`requireVendor` (submit/status) and `requireAuth`/`requireAdmin` (admin/*) pattern already established.

- [ ] **Step 4: Mount in app.ts**

```typescript
app.use("/api/verification", verificationRouter);
```

- [ ] **Step 5: Tests**

Cover: vendor submits → status `en_attente`; client account submitting → 401 (`requireVendor`); non-admin listing pending → 401; admin approves → status `approuvee`; admin rejects with reason → status `rejetee` + reason stored; re-submission after rejection resets to `en_attente`.

- [ ] **Step 6: Run tests, type-check, build, commit**

```bash
cd backend
npx tsc --noEmit --pretty false
npx vitest run
npm run build
git add backend/prisma backend/src/features/verification backend/src/features/users/user.repository.ts backend/src/app.ts
git commit -m "feat: add seller verification submission and admin review"
```

---

### Task 2: Appliquer la porte "vendeur vérifié" (retouche Phases 2 et 4)

**Files:**
- Modify: `backend/src/features/products/public.routes.ts` (Phase 2)
- Modify: `backend/src/features/orders/order.service.ts` (Phase 4)
- Modify: `backend/src/features/orders/order.test.ts` (Phase 4 — add one case)

**Interfaces:**
- No new interface — this task wires an existing check into existing code paths.

- [ ] **Step 1: Filtrer le flux public aux vendeurs approuvés**

In `public.routes.ts`, the `findPublic` query needs a join filter on `vendor.sellerVerificationStatus === "approuvee"`. Add this as a new `ProductRepository.findPublic` parameter (`Prisma.ProductWhereInput` already accepts nested relation filters — extend the `where` clause built in `public.routes.ts` to include `vendor: { sellerVerificationStatus: "approuvee" }`, no repository signature change needed since the current implementation already builds `where` inline in the route).

- [ ] **Step 2: Bloquer la création de commande pour un vendeur non vérifié**

In `OrderService.createFromOffer`, after loading the product/vendor, add a guard: if the vendor's `sellerVerificationStatus !== "approuvee"`, throw `ValidationError({ vendorId: "Ce vendeur n'est pas encore vérifié" })` before creating the order.

- [ ] **Step 3: Add regression test**

In `order.test.ts`, add a case: a freshly-registered vendor (default `non_soumise`) whose product receives an accepted offer → `POST /api/orders` returns 422.

- [ ] **Step 4: Run tests, build, commit**

```bash
cd backend
npx vitest run
npm run build
git add backend/src/features/products/public.routes.ts backend/src/features/orders/order.service.ts backend/src/features/orders/order.test.ts
git commit -m "feat: gate public listing and order creation behind seller verification"
```

---

### Task 3: Avis (Review) post-commande

**Files:**
- Create: `backend/src/features/reviews/review.repository.ts`
- Modify: `backend/prisma/schema.prisma` (model Review)
- Create: `backend/src/features/reviews/review.schema.ts`
- Create: `backend/src/features/reviews/review.service.ts`
- Create: `backend/src/features/reviews/review.controller.ts`
- Create: `backend/src/features/reviews/review.routes.ts`
- Modify: `backend/src/app.ts`
- Test: `backend/src/features/reviews/review.test.ts`

**Interfaces:**
- Produces: `reviewRouter` on `/api/reviews` — `POST /` (buyer, body `{ orderId, rating, comment }`). `publicReviewRouter` on `/api/public/vendors/:vendorId/reviews` — `GET /` (no auth).

- [ ] **Step 1: Schema**

```prisma
model Review {
  id        String   @id @default(uuid())
  orderId   String   @unique
  order     Order    @relation(fields: [orderId], references: [id])
  buyerId   String
  buyer     User     @relation("BuyerReviews", fields: [buyerId], references: [id])
  vendorId  String
  vendor    User     @relation("VendorReviews", fields: [vendorId], references: [id])
  rating    Int
  comment   String
  createdAt DateTime @default(now())
}
```
Add inverse relations on `User` (`buyerReviews`, `vendorReviews` — `Review[]`) and on `Order` (`review Review?`).

- [ ] **Step 2: Migration**

```bash
npx prisma migrate dev --name add_review
```

- [ ] **Step 3: Schema/service/controller/routes**

`review.schema.ts`: `createReviewSchema = z.object({ orderId: z.string().uuid(), rating: z.number().int().min(1).max(5), comment: z.string().min(5).max(1000) })`.

`review.service.ts` (`ReviewService.create(buyerId, input)`): loads the order, verifies `order.buyerId === buyerId` (`UnauthorizedError` otherwise), verifies `order.status === "confirme"` (`ValidationError` otherwise — "La commande doit être confirmée avant de laisser un avis"), verifies no existing review for that order (`ConflictError` — Prisma P2002 catch, matching the register-duplicate-email pattern from Phase 1), creates the review with `vendorId: order.vendorId`.

`review.controller.ts`/`review.routes.ts`: `POST /` under `requireAuth`. Public GET is a **separate, unauthenticated** router (`publicReviewRouter`) mounted at `/api/public/vendors/:vendorId/reviews`, listing reviews ordered by `createdAt desc`.

- [ ] **Step 4: Mount in app.ts**

```typescript
app.use("/api/reviews", reviewRouter);
app.use("/api/public/vendors/:vendorId/reviews", publicReviewRouter);
```

- [ ] **Step 5: Tests**

Cover: review on a non-`confirme` order → 422; review by someone other than the buyer → 401; successful review; duplicate review on the same order → 409; public GET returns the review without auth.

- [ ] **Step 6: Run tests, build, commit**

```bash
cd backend
npx tsc --noEmit --pretty false
npx vitest run
npm run build
git add backend/prisma backend/src/features/reviews backend/src/app.ts
git commit -m "feat: add post-order buyer reviews"
```

---

### Task 4: Score de confiance composite (affichage seul)

**Files:**
- Create: `backend/src/services/trustScore.ts`
- Modify: `backend/src/features/products/public.routes.ts` (route `GET /api/public/vendors/:vendorId/trust-score`, or fold into a small new route file — use `backend/src/features/reviews/public.routes.ts` alongside the reviews public route to keep one small "public vendor profile" surface)
- Test: `backend/src/services/trustScore.test.ts`

**Interfaces:**
- Produces: `computeTrustScore(vendorId: string): Promise<{ score: number; disputeRate: number; avgShipHours: number | null; accountAgeDays: number; responseRate: number }>`. `GET /api/public/vendors/:vendorId/trust-score` (no auth).

- [ ] **Step 1: Implement the composite formula**

`backend/src/services/trustScore.ts` — pulls from `prisma.order.findMany({ where: { vendorId } })` for dispute rate (`en_litige`/`rembourse` count ÷ total) and average ship time (`shipBy - createdAt`... actually the real signal is time-to-ship: for orders that reached `expedie` or later, approximate via `updatedAt` deltas is unreliable without a dedicated `shippedAt` timestamp — **add `shippedAt DateTime?` to `Order` in this task's migration**, set it in `OrderService.markShipped` (Phase 4 Task 3, retouched here), and use `shippedAt - paidAt`... `paidAt` doesn't exist either — simplest correct signal available without further schema growth: use `shipBy`-relative lateness is circular. Pragmatic V1 choice: average `(shippedAt - createdAt)` in hours for orders that have a `shippedAt`, treating order creation as a reasonable proxy for "when the clock effectively started" (slightly generous to the vendor, acceptable for a display-only V1 signal — document this simplification in a one-line comment, not a TODO).

Add `shippedAt DateTime?` to `Order` (migration), set `shippedAt: new Date()` inside `OrderService.markShipped`.

Formula: `score = round(100 - disputeRate*40 - lateShipPenalty*30 + min(accountAgeDays/365, 1)*15 + responseRate*15)`, clamped to `[0, 100]`. `responseRate` = fraction of that vendor's conversations (Phase 3 `ConversationRepository.findByParticipant`) where at least one message with `senderId === vendorId` exists (i.e. they replied at least once) — a coarse but real signal, not simulated.

- [ ] **Step 2: Route**

Add `GET /api/public/vendors/:vendorId/trust-score` returning the object from Step 1 as JSON, no auth required.

- [ ] **Step 3: Test**

`trustScore.test.ts`: build a vendor with a mix of confirmed/disputed orders and assert the score moves in the expected direction (a vendor with zero disputes and fast shipping scores higher than one with disputes) — assert relative ordering, not an exact magic number (formula constants may be tuned later; the test should survive that).

- [ ] **Step 4: Run tests, build, commit**

```bash
cd backend
npx prisma migrate dev --name add_order_shipped_at
npx tsc --noEmit --pretty false
npx vitest run
npm run build
git add backend/prisma backend/src/services/trustScore.ts backend/src/services/trustScore.test.ts backend/src/features/orders/order.service.ts backend/src/features/reviews/public.routes.ts
git commit -m "feat: add composite trust score (display-only)"
```

---

### Task 5: Frontend — vérification vendeur, avis, badge de confiance

**Files:**
- Create: `frontend/src/pages/Verification.tsx`
- Create: `frontend/src/pages/admin/AdminVerifications.tsx`
- Create: `frontend/src/components/ReviewForm.tsx`
- Create: `frontend/src/components/TrustBadge.tsx`
- Modify: `frontend/src/components/ProductCard.tsx` (affiche `TrustBadge` du vendeur si dispo)
- Modify: `frontend/src/pages/Commandes.tsx` (bouton "Laisser un avis" sur commande `confirme`)
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1-4:** Build these pages/components following the exact form/state/API-call patterns already established in `Catalogue.tsx`/`ProductForm.tsx` (Phase 2) and `Messagerie.tsx` (Phase 3) — plain unstyled forms, no new UI library. `Verification.tsx` reuses `uploadPhoto()` (Phase 2 `api/products.ts`) for the ID document upload since it's the same signed-Cloudinary-upload mechanism, just a different `folder` semantically (the existing `signUpload` service already scopes by `userId`, which is sufficient — no backend change needed here). Admin pages call the `/api/verification/admin/*` and gate on nothing client-side (server 403s non-admins, consistent with the "no separate admin auth guard in the frontend" convention already used).
- [ ] **Step 5: Build check**

```bash
cd frontend
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/Verification.tsx frontend/src/pages/admin frontend/src/components/ReviewForm.tsx frontend/src/components/TrustBadge.tsx frontend/src/components/ProductCard.tsx frontend/src/pages/Commandes.tsx frontend/src/App.tsx
git commit -m "feat: add verification, reviews and trust badge UI"
```

---

## Self-Review Notes

- **Spec coverage:** four trust layers from the design spec — ID verification gate, reviews tied to real confirmed orders, composite score (display-only, no automatic escrow influence), admin-only approval workflow.
- **Placeholder scan:** the trust-score time-to-ship simplification (using `createdAt` instead of a `paidAt` timestamp) is explicitly reasoned through and documented, not left as a TODO — it's a deliberate, stated V1 simplification.
- **Type consistency:** `sellerVerificationStatus` enum values match between Prisma schema, service, and the four-state UI already named in the design spec (`non_soumise`/`en_attente`/`approuvee`/`rejetee`).
- **Ownership scoping:** `ReviewService.create` and the verification submit/status endpoints all scope by `req.userId`; admin routes scope by the `ADMIN_EMAILS` allowlist established in Phase 4.