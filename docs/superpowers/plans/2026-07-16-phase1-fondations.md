# Phase 1 — Fondations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Backend et frontend scaffoldés, déployés bout-en-bout (Render + Vercel), avec inscription/connexion JWT fonctionnelle et un modèle User (`vendeur`/`client`).

**Architecture:** Backend Express + TypeScript feature-first (`backend/src/features/<feature>/`), PostgreSQL via Prisma (hébergé Neon), auth JWT access token courte durée + refresh token httpOnly cookie. Frontend React 18 + Vite + TypeScript, fetch wrapper typé pour parler à l'API, déployé en SPA statique sur Vercel.

**Tech Stack:** Node.js 20+, Express 4, TypeScript, Prisma, PostgreSQL (Neon), bcryptjs, jsonwebtoken, zod, pino, React 18, Vite, react-router-dom.

## Global Constraints

- Budget hébergement zéro/quasi-zéro : Render (backend, tier gratuit/starter), Vercel (frontend, tier gratuit), Neon (Postgres, tier gratuit persistant), Cloudinary (photos, tier gratuit — utilisé à partir de la Phase 2).
- UI copy en français (routes, messages d'erreur) — convention héritée du projet précédent, à respecter dès les premiers écrans.
- Toute donnée entrante validée en frontière (zod côté backend) — ne jamais faire confiance au client.
- JWT : claims minimaux (`userId`, `accountType`), jamais l'objet User complet.
- Pas de `console.log` en dehors du bootstrap — logging structuré JSON (pino) partout ailleurs.
- Pas de secrets committés — `.env.example` avec valeurs factices uniquement.

---

## File Structure

```
backend/
  src/
    shared/
      config/index.ts        # config typée, validation au démarrage
      logger/index.ts        # pino, request-id
      errors/index.ts        # hiérarchie d'erreurs typées
      middleware/
        errorHandler.ts
        requestId.ts
      db/client.ts            # singleton PrismaClient
    features/
      auth/
        auth.schema.ts        # zod schemas register/login
        auth.service.ts       # logique register/login/refresh
        auth.controller.ts    # handlers HTTP
        auth.routes.ts
        auth.middleware.ts    # requireAuth
        auth.test.ts
      users/
        user.repository.ts    # accès Prisma User
    app.ts                    # assemble middleware + routes, exporté (pas de listen ici)
    server.ts                 # écoute + shutdown gracieux
  prisma/
    schema.prisma
  package.json
  tsconfig.json
  .env.example
  render.yaml

frontend/
  src/
    api/
      client.ts                # fetch wrapper typé + refresh-on-401
    context/
      AuthContext.tsx
    pages/
      Login.tsx
      Register.tsx
      Dashboard.tsx
    routes/
      PrivateRoute.tsx
    App.tsx
    main.tsx
  index.html
  vite.config.ts
  package.json
  vercel.json
```

---

### Task 1: Backend scaffold — config, logger, erreurs, health check

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/.env.example`
- Create: `backend/src/shared/config/index.ts`
- Create: `backend/src/shared/logger/index.ts`
- Create: `backend/src/shared/errors/index.ts`
- Create: `backend/src/shared/middleware/errorHandler.ts`
- Create: `backend/src/shared/middleware/requestId.ts`
- Create: `backend/src/app.ts`
- Create: `backend/src/server.ts`
- Test: `backend/src/app.test.ts`

**Interfaces:**
- Produces: `config` (typed object: `port`, `nodeEnv`, `corsOrigin`, `jwt.accessSecret`, `jwt.refreshSecret`, `jwt.accessExpiresIn`, `jwt.refreshExpiresIn`, `database.url`), `logger` (pino instance), `AppError`/`NotFoundError`/`ValidationError`/`UnauthorizedError` classes, `errorHandler` middleware, `app` (Express instance, exported, no `.listen()`).

- [ ] **Step 1: Init backend package.json and deps**

```bash
mkdir -p backend/src/shared/{config,logger,errors,middleware,db} backend/src/features
cd backend
npm init -y
npm install express cors helmet pino pino-http zod bcryptjs jsonwebtoken cookie-parser @prisma/client
npm install -D typescript @types/express @types/node @types/cors @types/bcryptjs @types/jsonwebtoken @types/cookie-parser tsx prisma vitest supertest @types/supertest
```

- [ ] **Step 2: Write tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "resolveJsonModule": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Set package.json scripts and type**

Edit `backend/package.json`, add:

```json
{
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "vitest run",
    "prisma:migrate": "prisma migrate dev",
    "prisma:generate": "prisma generate"
  }
}
```

- [ ] **Step 4: Write config module**

`backend/src/shared/config/index.ts`:

```typescript
function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const config = {
  port: parseInt(process.env.PORT ?? "4000", 10),
  nodeEnv: process.env.NODE_ENV ?? "development",
  corsOrigin: requiredEnv("CORS_ORIGIN"),
  database: {
    url: requiredEnv("DATABASE_URL"),
  },
  jwt: {
    accessSecret: requiredEnv("JWT_ACCESS_SECRET"),
    refreshSecret: requiredEnv("JWT_REFRESH_SECRET"),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "30m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "30d",
  },
} as const;
```

- [ ] **Step 5: Write logger module**

`backend/src/shared/logger/index.ts`:

```typescript
import pino from "pino";
import { config } from "../config/index.js";

export const logger = pino({
  level: config.nodeEnv === "production" ? "info" : "debug",
});
```

`backend/src/shared/middleware/requestId.ts`:

```typescript
import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

export function requestId(req: Request, _res: Response, next: NextFunction) {
  req.requestId = randomUUID();
  next();
}
```

- [ ] **Step 6: Write typed error hierarchy**

`backend/src/shared/errors/index.ts`:

```typescript
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
    public readonly isOperational = true,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} introuvable`, "NOT_FOUND", 404);
  }
}

export class ValidationError extends AppError {
  constructor(public readonly details: Record<string, string>) {
    super("Données invalides", "VALIDATION_ERROR", 422);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentification requise") {
    super(message, "UNAUTHORIZED", 401);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, "CONFLICT", 409);
  }
}
```

- [ ] **Step 7: Write global error handler**

`backend/src/shared/middleware/errorHandler.ts`:

```typescript
import type { NextFunction, Request, Response } from "express";
import { AppError, ValidationError } from "../errors/index.js";
import { logger } from "../logger/index.js";

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ValidationError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      details: err.details,
      requestId: req.requestId,
    });
  }
  if (err instanceof AppError && err.isOperational) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      requestId: req.requestId,
    });
  }
  logger.error({ err, requestId: req.requestId }, "Erreur non gérée");
  res.status(500).json({ error: "Erreur interne", code: "INTERNAL_ERROR", requestId: req.requestId });
}
```

- [ ] **Step 8: Assemble app.ts (no listen)**

`backend/src/app.ts`:

```typescript
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import { config } from "./shared/config/index.js";
import { logger } from "./shared/logger/index.js";
import { requestId } from "./shared/middleware/requestId.js";
import { errorHandler } from "./shared/middleware/errorHandler.js";
import { authRouter } from "./features/auth/auth.routes.js";

export const app = express();

app.use(requestId);
app.use(pinoHttp({ logger }));
app.use(helmet());
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(cookieParser());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRouter);

app.use(errorHandler);
```

- [ ] **Step 9: Write server.ts with graceful shutdown**

`backend/src/server.ts`:

```typescript
import { app } from "./app.js";
import { config } from "./shared/config/index.js";
import { logger } from "./shared/logger/index.js";

const server = app.listen(config.port, () => {
  logger.info({ port: config.port }, "Serveur démarré");
});

process.on("SIGTERM", () => {
  logger.info("SIGTERM reçu, arrêt en cours");
  server.close(() => process.exit(0));
});
```

- [ ] **Step 10: Write .env.example**

`backend/.env.example`:

```
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
DATABASE_URL=postgresql://user:password@host/db?sslmode=require
JWT_ACCESS_SECRET=change-me-access
JWT_REFRESH_SECRET=change-me-refresh
JWT_ACCESS_EXPIRES_IN=30m
JWT_REFRESH_EXPIRES_IN=30d
```

Note: Task 1's `app.ts` imports `./features/auth/auth.routes.js`, which doesn't exist yet — this compiles/runs only once Task 3 is done. For this task's own test, import a minimal stub or run the health-check test after Task 3. To keep Task 1 independently testable, write the health-check test now and run it after Task 3's routes exist (call out this ordering explicitly to whoever executes the plan).

- [ ] **Step 11: Write health-check test**

`backend/src/app.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "./app.js";

describe("GET /health", () => {
  it("returns status ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});
```

- [ ] **Step 12: Commit**

```bash
git add backend/package.json backend/tsconfig.json backend/.env.example backend/src
git commit -m "feat: backend scaffold with config, logging, error handling"
```

---

### Task 2: Prisma + PostgreSQL (Neon) — modèle User

**Files:**
- Create: `backend/prisma/schema.prisma`
- Create: `backend/src/shared/db/client.ts`
- Create: `backend/src/features/users/user.repository.ts`
- Test: `backend/src/features/users/user.repository.test.ts`

**Interfaces:**
- Consumes: `config.database.url` (Task 1)
- Produces: `prisma` (singleton `PrismaClient`, from `shared/db/client.ts`), `UserRepository` class with `create(data)`, `findByEmail(email)`, `findById(id)` — each returns `User | null` (or `User` for `create`), where `User = { id: string; email: string; passwordHash: string; accountType: "vendeur" | "client"; createdAt: Date }`.

- [ ] **Step 1: Write Prisma schema**

`backend/prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum AccountType {
  vendeur
  client
}

model User {
  id           String      @id @default(uuid())
  email        String      @unique
  passwordHash String
  accountType  AccountType @default(vendeur)
  createdAt    DateTime    @default(now())
}
```

- [ ] **Step 2: Generate migration against Neon**

```bash
cd backend
npx prisma migrate dev --name init_user
```

Expected: creates `backend/prisma/migrations/<timestamp>_init_user/migration.sql`, applies it to the `DATABASE_URL` in `.env`, and runs `prisma generate`.

- [ ] **Step 3: Write Prisma client singleton**

`backend/src/shared/db/client.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
```

- [ ] **Step 4: Write UserRepository**

`backend/src/features/users/user.repository.ts`:

```typescript
import { prisma } from "../../shared/db/client.js";
import type { User, AccountType } from "@prisma/client";

export class UserRepository {
  create(data: { email: string; passwordHash: string; accountType: AccountType }): Promise<User> {
    return prisma.user.create({ data });
  }

  findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }
}
```

- [ ] **Step 5: Write repository test against real DB**

`backend/src/features/users/user.repository.test.ts`:

```typescript
import { describe, it, expect, afterAll } from "vitest";
import { UserRepository } from "./user.repository.js";
import { prisma } from "../../shared/db/client.js";

const repo = new UserRepository();

describe("UserRepository", () => {
  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: "repo-test@djassa.test" } });
    await prisma.$disconnect();
  });

  it("creates and finds a user by email", async () => {
    const created = await repo.create({
      email: "repo-test@djassa.test",
      passwordHash: "hashed",
      accountType: "client",
    });
    expect(created.id).toBeDefined();

    const found = await repo.findByEmail("repo-test@djassa.test");
    expect(found?.id).toBe(created.id);
  });

  it("returns null for unknown email", async () => {
    const found = await repo.findByEmail("nobody@djassa.test");
    expect(found).toBeNull();
  });
});
```

- [ ] **Step 6: Run tests**

```bash
cd backend && npx vitest run src/features/users/user.repository.test.ts
```

Expected: 2 passed (requires `DATABASE_URL` pointing at a reachable Neon database).

- [ ] **Step 7: Commit**

```bash
git add backend/prisma backend/src/shared/db backend/src/features/users
git commit -m "feat: add Prisma schema and User repository"
```

---

### Task 3: Auth — inscription, connexion, JWT, middleware

**Files:**
- Create: `backend/src/features/auth/auth.schema.ts`
- Create: `backend/src/features/auth/auth.service.ts`
- Create: `backend/src/features/auth/auth.controller.ts`
- Create: `backend/src/features/auth/auth.routes.ts`
- Create: `backend/src/features/auth/auth.middleware.ts`
- Test: `backend/src/features/auth/auth.test.ts`

**Interfaces:**
- Consumes: `UserRepository` (Task 2), `config.jwt` (Task 1), `AppError`/`ConflictError`/`UnauthorizedError`/`ValidationError` (Task 1)
- Produces: `authRouter` (Express Router, mounted at `/api/auth` in `app.ts`), `requireAuth` middleware (sets `req.userId: string` and `req.accountType: "vendeur" | "client"` on success, calls `next(new UnauthorizedError())` otherwise), `AuthService.register(email, password, accountType)` → `{ user, accessToken, refreshToken }`, `AuthService.login(email, password)` → `{ user, accessToken, refreshToken }`.

- [ ] **Step 1: Write validation schemas**

`backend/src/features/auth/auth.schema.ts`:

```typescript
import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  accountType: z.enum(["vendeur", "client"]).default("vendeur"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
```

- [ ] **Step 2: Write auth service**

`backend/src/features/auth/auth.service.ts`:

```typescript
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserRepository } from "../users/user.repository.js";
import { config } from "../../shared/config/index.js";
import { ConflictError, UnauthorizedError } from "../../shared/errors/index.js";
import type { RegisterInput, LoginInput } from "./auth.schema.js";

const userRepo = new UserRepository();

function signTokens(userId: string, accountType: string) {
  const accessToken = jwt.sign({ userId, accountType }, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
  });
  const refreshToken = jwt.sign({ userId }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
  return { accessToken, refreshToken };
}

export const AuthService = {
  async register(input: RegisterInput) {
    const existing = await userRepo.findByEmail(input.email);
    if (existing) throw new ConflictError("Un compte existe déjà avec cet email");

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await userRepo.create({
      email: input.email,
      passwordHash,
      accountType: input.accountType,
    });

    return { user, ...signTokens(user.id, user.accountType) };
  },

  async login(input: LoginInput) {
    const user = await userRepo.findByEmail(input.email);
    if (!user) throw new UnauthorizedError("Email ou mot de passe incorrect");

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) throw new UnauthorizedError("Email ou mot de passe incorrect");

    return { user, ...signTokens(user.id, user.accountType) };
  },

  refreshAccessToken(refreshToken: string): string {
    try {
      const payload = jwt.verify(refreshToken, config.jwt.refreshSecret) as { userId: string };
      return jwt.sign({ userId: payload.userId }, config.jwt.accessSecret, {
        expiresIn: config.jwt.accessExpiresIn,
      });
    } catch {
      throw new UnauthorizedError("Session expirée, reconnectez-vous");
    }
  },
};
```

- [ ] **Step 3: Write requireAuth middleware**

`backend/src/features/auth/auth.middleware.ts`:

```typescript
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../../shared/config/index.js";
import { UnauthorizedError } from "../../shared/errors/index.js";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      accountType?: string;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return next(new UnauthorizedError());

  try {
    const payload = jwt.verify(header.slice(7), config.jwt.accessSecret) as {
      userId: string;
      accountType: string;
    };
    req.userId = payload.userId;
    req.accountType = payload.accountType;
    next();
  } catch {
    next(new UnauthorizedError("Session invalide"));
  }
}
```

- [ ] **Step 4: Write controller + routes**

`backend/src/features/auth/auth.controller.ts`:

```typescript
import type { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service.js";
import { registerSchema, loginSchema } from "./auth.schema.js";
import { ValidationError } from "../../shared/errors/index.js";

const REFRESH_COOKIE = "djassa_refresh";
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "none" as const,
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

function toPublicUser(user: { id: string; email: string; accountType: string }) {
  return { id: user.id, email: user.email, accountType: user.accountType };
}

export async function register(req: Request, res: Response, next: NextFunction) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return next(new ValidationError(parsed.error.flatten().fieldErrors as Record<string, string>));

  try {
    const { user, accessToken, refreshToken } = await AuthService.register(parsed.data);
    res.cookie(REFRESH_COOKIE, refreshToken, REFRESH_COOKIE_OPTIONS);
    res.status(201).json({ user: toPublicUser(user), accessToken });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return next(new ValidationError(parsed.error.flatten().fieldErrors as Record<string, string>));

  try {
    const { user, accessToken, refreshToken } = await AuthService.login(parsed.data);
    res.cookie(REFRESH_COOKIE, refreshToken, REFRESH_COOKIE_OPTIONS);
    res.json({ user: toPublicUser(user), accessToken });
  } catch (err) {
    next(err);
  }
}

export function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (!token) throw new Error("no cookie");
    const accessToken = AuthService.refreshAccessToken(token);
    res.json({ accessToken });
  } catch (err) {
    next(err);
  }
}
```

`backend/src/features/auth/auth.routes.ts`:

```typescript
import { Router } from "express";
import { register, login, refresh } from "./auth.controller.js";

export const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/refresh", refresh);
```

- [ ] **Step 5: Write auth integration test**

`backend/src/features/auth/auth.test.ts`:

```typescript
import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import { prisma } from "../../shared/db/client.js";

describe("POST /api/auth/register + /api/auth/login", () => {
  const email = "auth-test@djassa.test";

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  it("registers a new user and returns an access token", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email, password: "password123", accountType: "client" });

    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.email).toBe(email);
  });

  it("rejects duplicate registration", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email, password: "password123", accountType: "client" });

    expect(res.status).toBe(409);
  });

  it("logs in with correct credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({ email, password: "password123" });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
  });

  it("rejects wrong password", async () => {
    const res = await request(app).post("/api/auth/login").send({ email, password: "wrong" });
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 6: Run full backend test suite**

```bash
cd backend && npx vitest run
```

Expected: all tests pass (health check + user repository + auth), requires a reachable `DATABASE_URL`.

- [ ] **Step 7: Commit**

```bash
git add backend/src/features/auth
git commit -m "feat: add JWT auth with register, login and refresh"
```

---

### Task 4: Frontend scaffold — client API, auth, pages

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/index.html`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/App.tsx`
- Create: `frontend/src/api/client.ts`
- Create: `frontend/src/context/AuthContext.tsx`
- Create: `frontend/src/routes/PrivateRoute.tsx`
- Create: `frontend/src/pages/Register.tsx`
- Create: `frontend/src/pages/Login.tsx`
- Create: `frontend/src/pages/Dashboard.tsx`

**Interfaces:**
- Consumes: backend `/api/auth/register`, `/api/auth/login`, `/api/auth/refresh` (Task 3) — response shape `{ user: { id, email, accountType }, accessToken }`.
- Produces: `useAuth()` hook (`{ user, login(email,password), register(email,password,accountType), logout(), isLoading }`), `<PrivateRoute>` component.

- [ ] **Step 1: Scaffold Vite React TS app**

```bash
cd /Users/macbookair/Desktop/DJASSA
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npm install react-router-dom
```

- [ ] **Step 2: Write typed API client with refresh-on-401**

`frontend/src/api/client.ts`:

```typescript
const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(public status: number, public body: { error?: string } | null) {
    super(body?.error ?? `Erreur API ${status}`);
  }
}

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

async function rawRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, body);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  try {
    return await rawRequest<T>(path, options);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401 && path !== "/api/auth/refresh") {
      const { accessToken: newToken } = await rawRequest<{ accessToken: string }>("/api/auth/refresh", {
        method: "POST",
      });
      setAccessToken(newToken);
      return rawRequest<T>(path, options);
    }
    throw err;
  }
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data: unknown) => request<T>(path, { method: "POST", body: JSON.stringify(data) }),
};
```

- [ ] **Step 3: Write AuthContext**

`frontend/src/context/AuthContext.tsx`:

```tsx
import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { apiClient, setAccessToken } from "../api/client";

type AccountType = "vendeur" | "client";
type User = { id: string; email: string; accountType: AccountType };
type AuthResponse = { user: User; accessToken: string };

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, accountType: AccountType) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiClient.post<AuthResponse>("/api/auth/login", { email, password });
    setAccessToken(res.accessToken);
    setUser(res.user);
  }, []);

  const register = useCallback(async (email: string, password: string, accountType: AccountType) => {
    const res = await apiClient.post<AuthResponse>("/api/auth/register", { email, password, accountType });
    setAccessToken(res.accessToken);
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    setAccessToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans AuthProvider");
  return ctx;
}
```

- [ ] **Step 4: Write PrivateRoute**

`frontend/src/routes/PrivateRoute.tsx`:

```tsx
import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";

export function PrivateRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <p>Chargement...</p>;
  if (!user) return <Navigate to="/connexion" replace />;
  return <>{children}</>;
}
```

- [ ] **Step 5: Write Login, Register, Dashboard pages**

`frontend/src/pages/Login.tsx`:

```tsx
import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../api/client";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      navigate("/tableau-de-bord");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur de connexion");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Connexion</h1>
      {error && <p role="alert">{error}</p>}
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Mot de passe"
        required
      />
      <button type="submit">Se connecter</button>
      <p>
        Pas de compte ? <Link to="/inscription">Créer un compte</Link>
      </p>
    </form>
  );
}
```

`frontend/src/pages/Register.tsx`:

```tsx
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../api/client";

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState<"vendeur" | "client">("client");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await register(email, password, accountType);
      navigate("/tableau-de-bord");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur d'inscription");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Créer un compte</h1>
      {error && <p role="alert">{error}</p>}
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Mot de passe (8 caractères min.)"
        required
      />
      <select value={accountType} onChange={(e) => setAccountType(e.target.value as "vendeur" | "client")}>
        <option value="client">Acheteur</option>
        <option value="vendeur">Vendeur</option>
      </select>
      <button type="submit">S'inscrire</button>
    </form>
  );
}
```

`frontend/src/pages/Dashboard.tsx`:

```tsx
import { useAuth } from "../context/AuthContext";

export function Dashboard() {
  const { user, logout } = useAuth();
  return (
    <div>
      <h1>Tableau de bord</h1>
      <p>Connecté en tant que {user?.email} ({user?.accountType})</p>
      <button onClick={logout}>Se déconnecter</button>
    </div>
  );
}
```

- [ ] **Step 6: Wire App.tsx and main.tsx**

`frontend/src/App.tsx`:

```tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { PrivateRoute } from "./routes/PrivateRoute";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Dashboard } from "./pages/Dashboard";

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/connexion" replace />} />
          <Route path="/connexion" element={<Login />} />
          <Route path="/inscription" element={<Register />} />
          <Route
            path="/tableau-de-bord"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

`frontend/src/main.tsx`:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 7: Add .env.example for frontend**

`frontend/.env.example`:

```
VITE_API_URL=http://localhost:4000
```

- [ ] **Step 8: Run dev servers and smoke test manually**

```bash
cd backend && npm run dev &
cd frontend && npm run dev &
```

Expected: visiting `http://localhost:5173/inscription`, submitting the form creates a user (verified via `/health` and a manual register through the UI), redirects to `/tableau-de-bord`, shows the connected email.

- [ ] **Step 9: Commit**

```bash
git add frontend
git commit -m "feat: frontend scaffold with auth pages and API client"
```

---

### Task 5: Déploiement Render + Vercel

**Files:**
- Create: `backend/render.yaml`
- Create: `frontend/vercel.json`

**Interfaces:**
- Consumes: `config.corsOrigin` (Task 1) must equal the deployed Vercel URL in production.
- Produces: none (deployment config only).

- [ ] **Step 1: Write render.yaml**

`backend/render.yaml`:

```yaml
services:
  - type: web
    name: djassa-backend
    env: node
    plan: free
    buildCommand: npm install && npm run build && npx prisma generate
    startCommand: npm start
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        sync: false
      - key: JWT_ACCESS_SECRET
        sync: false
      - key: JWT_REFRESH_SECRET
        sync: false
      - key: CORS_ORIGIN
        sync: false
```

- [ ] **Step 2: Write vercel.json for SPA routing**

`frontend/vercel.json`:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

- [ ] **Step 3: Document manual deployment steps**

Add to `backend/render.yaml`'s neighboring note (not a file — instructions for whoever deploys):
1. Create a Neon Postgres project, copy its connection string into Render's `DATABASE_URL` env var (with `?sslmode=require`).
2. In Render, create the web service from `backend/`, connect the GitHub repo, confirm `render.yaml` is picked up.
3. Set `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` to distinct random 32+ byte values (e.g. `openssl rand -hex 32`).
4. Deploy frontend to Vercel pointing at `frontend/`, set `VITE_API_URL` to the Render service URL.
5. Set Render's `CORS_ORIGIN` to the Vercel deployment URL once known (redeploy after).

- [ ] **Step 4: Run production build check locally**

```bash
cd backend && npm run build
cd ../frontend && npm run build
```

Expected: both complete without TypeScript errors, producing `backend/dist/` and `frontend/dist/`.

- [ ] **Step 5: Commit**

```bash
git add backend/render.yaml frontend/vercel.json
git commit -m "chore: add Render and Vercel deployment config"
```

---

## Self-Review Notes

- **Spec coverage:** This plan covers only the "Fondations" slice of the spec (auth, User model, deployment skeleton) — trust system (escrow, verification, reviews, score), monetization, and chat are deliberately out of scope here and will each get their own plan (Phases 2–6) per the phase breakdown agreed with the user.
- **Placeholder scan:** No TBD/TODO left in code steps; the one explicit note (Task 1 Step 10) is a legitimate task-ordering caveat, not a placeholder.
- **Type consistency:** `User` shape (`id`, `email`, `accountType`) is consistent across `user.repository.ts` (Task 2), `auth.service.ts`/`auth.controller.ts` (Task 3), and the frontend `AuthContext.tsx` (Task 4). `accessToken` naming is consistent across backend responses and frontend consumption.
