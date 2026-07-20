# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

| Layer | Tech |
|-------|------|
| **Backend** | Node.js 22, Express 5, TypeScript 7 |
| **Database** | PostgreSQL via Prisma ORM 6 |
| **Frontend** | React 19, Vite 8, Tailwind CSS 4, React Router 7 |
| **UI** | shadcn/ui (Radix UI primitives), Lucide icons, GSAP animations |
| **Charts** | Recharts |
| **Real-time** | Socket.IO (server + client) |
| **Payments** | GeniusPay (Côte d'Ivoire) |
| **File uploads** | Cloudinary (server-signed uploads) |
| **Email** | Resend |
| **Tests** | Vitest + Supertest |
| **Linting** | oxlint (frontend only) |
| **Hosting** | Render (backend), Vercel (frontend) |

## Architecture

```
DJASSA/
├── backend/                   ← Express 5 API server
│   ├── src/
│   │   ├── app.ts             ← Express app setup (middleware, routes)
│   │   ├── server.ts          ← HTTP server entry (Socket.IO, cron jobs)
│   │   ├── config/            ← Marketplace constants, plan pricing
│   │   ├── features/          ← Feature modules (one per domain)
│   │   │   ├── auth/          ← Register, login, JWT, password reset
│   │   │   ├── admin/         ← Admin overview, emails, disputes
│   │   │   ├── analytics/     ← Session tracking, event ingestion
│   │   │   ├── billing/       ← GeniusPay webhooks, subscriptions
│   │   │   ├── conversations/ ← Buyer-vendor messaging
│   │   │   ├── orders/        ← Order lifecycle, escrow, shipping
│   │   │   ├── products/      ← CRUD, public listing, sitemap
│   │   │   ├── reports/       ← User/message/product reports
│   │   │   ├── reviews/       ← Ratings, trust score
│   │   │   ├── uploads/       ← Cloudinary signed-upload endpoint
│   │   │   ├── users/         ← Public vendor profiles
│   │   │   ├── verification/  ← Seller KYC document verification
│   │   │   └── waitlist/      ← Pre-launch signups
│   │   ├── jobs/              ← Scheduled cron jobs (order timeouts)
│   │   ├── services/          ← Cross-cutting: GeniusPay, realtime, trust score
│   │   └── shared/            ← Config, Prisma client, logger (Pino), errors, middleware
│   ├── prisma/
│   │   ├── schema.prisma      ← Full data model (11 migrations)
│   │   └── seed.ts
│   └── vitest.config.ts
│
└── frontend/                  ← React SPA (Vite)
    ├── src/
    │   ├── App.tsx            ← Router, context providers, analytics init
    │   ├── main.tsx           ← Entry point (TooltipProvider, Toaster)
    │   ├── api/               ← Typed API client with auto-refresh on 401
    │   ├── components/        ← Reusable UI and feature components
    │   │   ├── ui/            ← shadcn/ui primitives (button, dialog, etc.)
    │   │   ├── site/          ← Header, footer, mobile tab bar, logo
    │   │   ├── admin/         ← Admin shell layout
    │   │   ├── auth/          ← Auth layout, password input
    │   │   ├── orders/        ← Ship order dialog
    │   │   └── visual/        ← Landing animations, marquee, testimonials
    │   ├── context/           ← AuthContext + CartContext (React Context, no Zustand)
    │   ├── hooks/             ← useLandingMotion, usePageTitle
    │   ├── lib/               ← Utils (cn, formatFcfa), pricing helpers, analytics tracker
    │   ├── pages/             ← Route pages (Landing, Login, Register, Marche, etc.)
    │   │   ├── admin/         ← Admin dashboard pages (lazy-loaded)
    │   │   └── vendeur/       ← Vendor dashboard & search
    │   ├── realtime/          ← Socket.IO client wrapper
    │   └── routes/            ← Private, Admin, Vendor, VendorBlocked guards
    └── vite.config.ts         ← @ alias, Tailwind plugin
```

## Domain model (Prisma)

The app is a **peer-to-peer marketplace with escrow** connecting buyers ("client") and sellers ("vendeur"). Key entities:

- **User** — email, phone, password (bcrypt), `accountType` (vendeur/client), `planTier` (standard/pro), seller verification status
- **Product** — title, description, category (enum), price (integer FCFA), photos[], discountPercent, shippingFee, deliveryInfo
- **Conversation / ChatMessage** — buyer-vendor thread per product, supports offerPrice on messages
- **Order** — tracks checkoutRef, price/commission/netAmount, status (en_attente_paiement → paye → expedie → confirme), dispute/review links, shipping tracking
- **Review** — rating 1-5, comment, linked 1:1 to a completed Order
- **Payment** — GeniusPay reference tracking (pending/paid)
- **AnalyticsSession / AnalyticsEvent** — visitor session tracking with device, geo, referrer info
- **WaitlistSignup** — pre-launch email capture
- **Report** — flag products/users/messages for admin review

## Key patterns

- **Feature modules** are self-contained: `*.routes.ts`, `*.controller.ts`, `*.service.ts`, `*.schema.ts` (Zod), `*.repository.ts`, `*.test.ts`. Routes register on the Express app in `app.ts`.
- **API routes** do NOT use version prefix (e.g. `/api/auth/register`, not `/api/v1/auth/register`).
- **Auth** uses JWT access + refresh token pattern. `requireAuth` / `optionalAuth` / `requireVendor` / `requireAdmin` middleware decode the token and set `req.userId`.
- **Error handling** is via AppError subclasses (NotFoundError, ValidationError, UnauthorizedError, ConflictError) with a centralized error handler.
- **The frontend API client** (`api/client.ts`) auto-refreshes expired access tokens on 401 (except for login/register/refresh/logout endpoints).
- **State management** uses React Context (AuthContext, CartContext) — no external state library.
- **Lazy loading** — authenticated pages (Catalogue, Panier, Checkout, Messagerie, all admin/vendor pages) are `React.lazy()` loaded.
- **Analytics** — a custom in-house analytics system sends pageviews, clicks, errors, and session data to the backend `/api/analytics/ingest` endpoint, batched and flushed every 8s and on pagehide.
- **Pricing** uses integer FCFA (CFA franc) amounts. Helper functions: `formatFcfa()`, `effectiveUnitPrice()`, `productUnitPrice()`, `productTotalPrice()`.

## Commands

```bash
# Backend
cd backend && npm run dev          # Start dev server with hot reload (tsx watch)
cd backend && npm run build        # TypeScript compile
cd backend && npm test             # Run all tests (vitest)
cd backend && npx vitest run src/features/auth/auth.test.ts   # Single test file
cd backend && npm run prisma:migrate   # Create new Prisma migration
cd backend && npm run prisma:generate  # Regenerate Prisma client
cd backend && npm run prisma:seed      # Run seed script

# Frontend
cd frontend && npm run dev         # Start Vite dev server (port 5173)
cd frontend && npm run build       # tsc -b && vite build
cd frontend && npm run lint        # oxlint
cd frontend && npm run preview     # Preview production build
```

## Conventions

- **Language**: Code comments, UI text, and commit messages are in **French** (the app targets the Ivorian market).
- **API errors** use `AppError` subclasses with a `code` string, `statusCode`, and `isOperational` flag.
- **Validation** everywhere via Zod schemas (both backend request bodies and frontend forms).
- **No `any`** — use `unknown` with type guards.
- **Prices** are always stored as integers (FCFA, the smallest unit).
- **Database queries** go through repository classes/files, not inline in controllers or services.
- **Socket.IO** events are emitted per-user via `emitToUser(userId, event, payload)`.
- **Env vars** are required on startup — missing keys throw immediately (except Resend API key, which is optional).
