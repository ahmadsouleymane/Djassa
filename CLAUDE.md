# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Djassa is a C2C marketplace (French-language product/UX: "Marché", "Catalogue", "Commandes", "Messagerie") where sellers ("vendeurs") list products, chat with buyers, negotiate a price via a chat offer, and turn accepted offers into escrow-style orders with a commission cut. It's a two-package repo: `backend` (Express/Prisma/Postgres API) and `frontend` (React/Vite SPA). There is no root-level app — always work inside `backend/` or `frontend/`.

## Commands

All commands are run from inside `backend/` or `frontend/` respectively — there are no root-level scripts.

### Backend (`backend/`)
- `npm run dev` — run the API with hot reload (tsx watch on `src/server.ts`)
- `npm run build` — type-check and compile to `dist/`
- `npm start` — run the compiled server (`dist/server.js`)
- `npm test` — run the full Vitest suite once
- `npx vitest run src/features/products/product.test.ts` — run a single test file
- `npx vitest run -t "creates a product"` — run tests matching a name
- `npm run prisma:migrate` — create/apply a dev migration from `prisma/schema.prisma`
- `npm run prisma:generate` — regenerate the Prisma client after a schema change
- `npm run prisma:seed` — run `prisma/seed.ts`

### Frontend (`frontend/`)
- `npm run dev` — Vite dev server (port 5173)
- `npm run build` — `tsc -b` then `vite build`
- `npm run lint` — oxlint (config: `frontend/.oxlintrc.json`)
- `npm run preview` — preview a production build

### Tests need a real database
Backend tests (`*.test.ts` next to the code they cover) are **not mocked** — repository and route tests hit the real Postgres database configured by `DATABASE_URL`/`.env`, and clean up their own rows in `afterAll`. Make sure a reachable database and applied migrations exist before running `npm test`.

## Architecture

### Backend: feature-sliced, layered modules
Each domain lives under `backend/src/features/<name>/` with a consistent file set:
- `*.routes.ts` — Express `Router`, wires middleware (`requireAuth`, `requireVendor`, `requireAdmin`) to controller functions
- `*.controller.ts` — parses `req`, calls the service, shapes the HTTP response
- `*.service.ts` — business rules and cross-repository orchestration (the layer with authorization checks like "does this product belong to this vendor")
- `*.repository.ts` — the only layer that talks to Prisma (`shared/db/client.ts`)
- `*.schema.ts` — Zod input schemas
- `*.test.ts` — Vitest, hits the real DB

Features: `auth`, `products`, `conversations` (chat + offers), `orders` (checkout/escrow lifecycle), `billing` (subscriptions/payments), `reviews`, `verification` (seller KYC), `uploads` (Cloudinary), `users`.

`backend/src/app.ts` is the single place that assembles the Express app and mounts every feature router — read it first to see the full API surface and route prefixes. `backend/src/server.ts` boots the HTTP server, `initRealtime` (Socket.IO), and the background `orderTimeoutJob`.

Cross-cutting code lives in `backend/src/shared/`: `errors` (typed `AppError` subclasses — `NotFoundError`, `ValidationError`, `UnauthorizedError`, `ConflictError` — thrown from services and turned into HTTP responses by `shared/middleware/errorHandler.ts`), `config` (env var loading, throws at startup on missing required vars), `logger` (pino), `db/client.ts` (the shared `PrismaClient` singleton).

Marketplace business constants (commission rates, shipping/confirmation deadlines, plan pricing) live in `backend/src/config/marketplace.ts` and `backend/src/config/plans.ts`, not scattered in services.

### Order lifecycle (the core domain flow)
A conversation offer (`ChatMessage.offerPrice`) becomes an `Order` via `OrderService.createFromOffer`, which requires the vendor to already be `sellerVerificationStatus: approuvee`. Orders move through `en_attente_paiement → paye → expedie → confirme`, with `en_litige`/`rembourse` as dispute branches. `backend/src/jobs/orderTimeoutJob.ts` runs every 15 minutes (`OrderService.sweepTimeouts`) to auto-refund orders past their ship deadline and auto-release orders past their confirm deadline (see `MARKETPLACE_SHIP_DEADLINE_HOURS` / `MARKETPLACE_CONFIRM_DEADLINE_DAYS`). Commission is computed by `computeCommission()` based on the vendor's `planTier` (standard vs pro) at offer-acceptance time.

### Auth
JWT access + refresh tokens (`jsonwebtoken`), refresh token in an httpOnly cookie (`cookie-parser`), access token passed as a Bearer header and held in memory on the frontend (never localStorage — see `frontend/src/api/client.ts`). `requireAuth` populates `req.userId`/`req.accountType`; `requireVendor` gates vendor-only routes; `requireAdmin` checks the caller's email against the `ADMIN_EMAILS` env var (there's no admin role in the DB).

### Realtime
`backend/src/services/realtime.ts` authenticates Socket.IO connections with the same JWT access secret and joins each socket to a `user:<id>` room; `emitToUser` is how services push events (e.g. new chat messages) to a specific connected user. Frontend counterpart is `frontend/src/realtime/socket.ts`.

### Frontend
Vite + React 19 + React Router 7, all routing declared in `frontend/src/App.tsx`. `AuthContext` (`frontend/src/context/AuthContext.tsx`) restores a session on load via `/api/auth/refresh` + `/api/auth/me`, and `PrivateRoute` gates authenticated pages. `frontend/src/api/client.ts` is the single fetch wrapper: it attaches the in-memory access token, retries once on a 401 by calling `/api/auth/refresh`, and throws `ApiError` on non-OK responses — feature API modules under `frontend/src/api/*.ts` (e.g. `products.ts`, `orders.ts`) build on top of it rather than calling `fetch` directly. Pages are French-named and route-aligned (`Marche`, `Catalogue`, `Messagerie`, `Commandes`, `Verification`, `Abonnement`).

### Data model
See `backend/prisma/schema.prisma` for the source of truth. Key relations: `User` (vendeur/client) → `Product` → `Conversation` (unique per buyer/vendor/product) → `ChatMessage` (optionally carries an `offerPrice`) → `Order` (1:1 with the accepting `ChatMessage`) → optional `Review`. `Payment` tracks subscription payments separately from order payments.

Money is stored as integer FCFA (no decimals) throughout — see `price`, `commissionAmount`, `netAmount` on `Order` and `PRO_MONTHLY_PRICE` in `config/plans.ts`.

## Conventions worth knowing
- Backend uses native ESM (`"type": "module"`) — relative imports must include the `.js` extension even though the source is `.ts` (NodeNext module resolution).
- User-facing error messages thrown from services are in French (e.g. `"Produit introuvable"`) since they may surface directly in the UI.
- Config values are read strictly through `shared/config/index.ts`; new required env vars should be added there via `requiredEnv()` so missing config fails fast at boot, and mirrored in the relevant `.env.example`.
