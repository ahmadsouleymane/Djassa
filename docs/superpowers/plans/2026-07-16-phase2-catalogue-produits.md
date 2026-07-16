# Phase 2 — Catalogue produits + upload photo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Un vendeur peut créer/modifier/supprimer des produits avec photos (upload direct Cloudinary), et n'importe qui peut parcourir le catalogue public multi-vendeurs.

**Architecture:** Nouvelle feature `products` suivant le pattern feature-first de la Phase 1 (schema/service/controller/routes). Upload photo en deux temps : le backend signe une requête Cloudinary (HMAC, sans toucher aux octets de l'image), le navigateur uploade directement vers Cloudinary, puis renvoie l'URL au backend pour l'attacher au produit.

**Tech Stack:** Identique Phase 1 (Express+TS+Prisma+PostgreSQL, React+Vite+TS) + `cloudinary` (SDK Node, signature seulement, pas d'upload serveur).

## Global Constraints

- Prix en FCFA, entier, jamais de décimales (convention héritée du projet précédent).
- Seuls les comptes `accountType: "vendeur"` peuvent créer/gérer des produits ; les comptes `client` ont un accès lecture seule au flux public.
- Ownership scoping : toute route de gestion catalogue filtre par `vendorId: req.userId` — jamais de query qui saute ce filtre (convention établie dans le projet précédent, reconduite ici).
- Pas de secrets committés — `CLOUDINARY_*` dans `.env.example` avec valeurs factices.

---

## File Structure

```
backend/
  prisma/schema.prisma          # + model Product, enum ProductCategory
  src/
    shared/
      config/index.ts           # + cloudinary config block
    features/
      uploads/
        upload.service.ts       # signature Cloudinary
        upload.controller.ts
        upload.routes.ts
      products/
        product.schema.ts       # zod: create/update product
        product.repository.ts   # Prisma access
        product.service.ts      # règles métier (ownership, limite 5 photos)
        product.controller.ts
        product.routes.ts       # /api/products (privé, vendeur)
        product.test.ts
    routes publiques:
      features/products/public.routes.ts  # /api/public/products (lecture seule)

frontend/
  src/
    api/products.ts             # typed helpers pour products + upload
    pages/
      Catalogue.tsx              # vendeur : liste + création produit
      Marche.tsx                 # public : flux découverte + filtre catégorie
    components/
      ProductForm.tsx
      ProductCard.tsx
```

---

### Task 1: Modèle Product (Prisma) + repository

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Create: `backend/src/features/products/product.repository.ts`
- Test: `backend/src/features/products/product.repository.test.ts`

**Interfaces:**
- Consumes: `prisma` singleton (Phase 1, `shared/db/client.ts`)
- Produces: `ProductRepository` avec `create(data)`, `findById(id)`, `findByVendor(vendorId)`, `findPublic({ category?, cursor?, limit })`, `update(id, data)`, `delete(id)`. Type `Product = { id, vendorId, title, description, price, category, photos: string[], createdAt }`.

- [ ] **Step 1: Étendre le schema Prisma**

Ajouter à `backend/prisma/schema.prisma` (après le modèle `User`) :

```prisma
enum ProductCategory {
  mode_beaute
  electronique
  maison
  telephones
  alimentation
  autre
}

model Product {
  id          String          @id @default(uuid())
  vendorId    String
  vendor      User            @relation(fields: [vendorId], references: [id])
  title       String
  description String
  price       Int
  category    ProductCategory
  photos      String[]
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
}
```

Ajouter la relation inverse sur `User` (dans le même fichier) :

```prisma
model User {
  id           String      @id @default(uuid())
  email        String      @unique
  passwordHash String
  accountType  AccountType @default(vendeur)
  createdAt    DateTime    @default(now())
  products     Product[]
}
```

- [ ] **Step 2: Générer et appliquer la migration**

```bash
cd backend
npx prisma migrate dev --name add_product
```

Expected: crée `prisma/migrations/<timestamp>_add_product/migration.sql`, l'applique à la base locale, régénère le client.

- [ ] **Step 3: Écrire ProductRepository**

`backend/src/features/products/product.repository.ts`:

```typescript
import { prisma } from "../../shared/db/client.js";
import type { Product, ProductCategory, Prisma } from "@prisma/client";

type CreateInput = {
  vendorId: string;
  title: string;
  description: string;
  price: number;
  category: ProductCategory;
  photos: string[];
};

type UpdateInput = Partial<Omit<CreateInput, "vendorId">>;

export class ProductRepository {
  create(data: CreateInput): Promise<Product> {
    return prisma.product.create({ data });
  }

  findById(id: string): Promise<Product | null> {
    return prisma.product.findUnique({ where: { id } });
  }

  findByVendor(vendorId: string): Promise<Product[]> {
    return prisma.product.findMany({ where: { vendorId }, orderBy: { createdAt: "desc" } });
  }

  findPublic(options: { category?: ProductCategory; cursor?: string; limit: number }): Promise<Product[]> {
    const where: Prisma.ProductWhereInput = options.category ? { category: options.category } : {};
    return prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: options.limit,
      ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
    });
  }

  update(id: string, data: UpdateInput): Promise<Product> {
    return prisma.product.update({ where: { id }, data });
  }

  delete(id: string): Promise<Product> {
    return prisma.product.delete({ where: { id } });
  }
}
```

- [ ] **Step 4: Écrire le test du repository**

`backend/src/features/products/product.repository.test.ts`:

```typescript
import { describe, it, expect, afterAll, beforeAll } from "vitest";
import { ProductRepository } from "./product.repository.js";
import { UserRepository } from "../users/user.repository.js";
import { prisma } from "../../shared/db/client.js";

const productRepo = new ProductRepository();
const userRepo = new UserRepository();
let vendorId: string;

describe("ProductRepository", () => {
  beforeAll(async () => {
    const vendor = await userRepo.create({
      email: "product-repo-vendor@djassa.test",
      passwordHash: "hashed",
      accountType: "vendeur",
    });
    vendorId = vendor.id;
  });

  afterAll(async () => {
    await prisma.product.deleteMany({ where: { vendorId } });
    await prisma.user.deleteMany({ where: { id: vendorId } });
    await prisma.$disconnect();
  });

  it("creates a product and finds it by vendor", async () => {
    const created = await productRepo.create({
      vendorId,
      title: "Robe wax",
      description: "Robe en tissu wax, taille M",
      price: 15000,
      category: "mode_beaute",
      photos: ["https://res.cloudinary.com/demo/image/upload/robe.jpg"],
    });
    expect(created.id).toBeDefined();

    const list = await productRepo.findByVendor(vendorId);
    expect(list).toHaveLength(1);
    expect(list[0].title).toBe("Robe wax");
  });

  it("lists public products filtered by category", async () => {
    const results = await productRepo.findPublic({ category: "mode_beaute", limit: 10 });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((p) => p.category === "mode_beaute")).toBe(true);
  });
});
```

- [ ] **Step 5: Run tests**

```bash
npx vitest run src/features/products/product.repository.test.ts
```

Expected: 2 passed.

- [ ] **Step 6: Commit**

```bash
git add backend/prisma backend/src/features/products/product.repository.ts backend/src/features/products/product.repository.test.ts
git commit -m "feat: add Product model and repository"
```

---

### Task 2: Upload signé Cloudinary

**Files:**
- Modify: `backend/src/shared/config/index.ts`
- Create: `backend/src/features/uploads/upload.service.ts`
- Create: `backend/src/features/uploads/upload.controller.ts`
- Create: `backend/src/features/uploads/upload.routes.ts`
- Modify: `backend/src/app.ts`
- Modify: `backend/.env.example`
- Test: `backend/src/features/uploads/upload.test.ts`

**Interfaces:**
- Consumes: `requireAuth` (Phase 1, `features/auth/auth.middleware.ts`)
- Produces: `uploadRouter` monté sur `/api/uploads`, endpoint `POST /api/uploads/sign` (requireAuth) → `{ cloudName, apiKey, timestamp, signature, folder }`.

- [ ] **Step 1: Ajouter la config Cloudinary**

Modifier `backend/src/shared/config/index.ts`, ajouter au bloc `config` :

```typescript
  cloudinary: {
    cloudName: requiredEnv("CLOUDINARY_CLOUD_NAME"),
    apiKey: requiredEnv("CLOUDINARY_API_KEY"),
    apiSecret: requiredEnv("CLOUDINARY_API_SECRET"),
  },
```

- [ ] **Step 2: Installer le SDK Cloudinary**

```bash
cd backend
npm install cloudinary
```

- [ ] **Step 3: Écrire le service de signature**

`backend/src/features/uploads/upload.service.ts`:

```typescript
import { v2 as cloudinary } from "cloudinary";
import { config } from "../../shared/config/index.js";

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

export function signUpload(userId: string) {
  const timestamp = Math.round(Date.now() / 1000);
  const folder = `djassa/products/${userId}`;
  const signature = cloudinary.utils.api_sign_request({ timestamp, folder }, config.cloudinary.apiSecret);

  return {
    cloudName: config.cloudinary.cloudName,
    apiKey: config.cloudinary.apiKey,
    timestamp,
    signature,
    folder,
  };
}
```

- [ ] **Step 4: Écrire le controller et les routes**

`backend/src/features/uploads/upload.controller.ts`:

```typescript
import type { Request, Response } from "express";
import { signUpload } from "./upload.service.js";

export function sign(req: Request, res: Response) {
  res.json(signUpload(req.userId!));
}
```

`backend/src/features/uploads/upload.routes.ts`:

```typescript
import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { sign } from "./upload.controller.js";

export const uploadRouter = Router();

uploadRouter.post("/sign", requireAuth, sign);
```

- [ ] **Step 5: Monter le router dans app.ts**

Modifier `backend/src/app.ts`, ajouter l'import et le montage :

```typescript
import { uploadRouter } from "./features/uploads/upload.routes.js";
```

```typescript
app.use("/api/uploads", uploadRouter);
```
(juste après `app.use("/api/auth", authRouter);`)

- [ ] **Step 6: Ajouter les variables d'environnement**

Ajouter à `backend/.env.example` :

```
CLOUDINARY_CLOUD_NAME=demo
CLOUDINARY_API_KEY=change-me
CLOUDINARY_API_SECRET=change-me
```

Ajouter les mêmes lignes (avec des valeurs de test factices mais cohérentes, ex: `CLOUDINARY_CLOUD_NAME=test`, `CLOUDINARY_API_KEY=test-key`, `CLOUDINARY_API_SECRET=test-secret`) au `.env` local — la signature se calcule localement (HMAC), aucun appel réseau à Cloudinary n'est fait par ce endpoint, donc ça fonctionne même sans compte Cloudinary réel. L'upload réel du navigateur vers Cloudinary (Task 5) nécessitera un vrai compte avant d'aller en production.

- [ ] **Step 7: Écrire le test**

`backend/src/features/uploads/upload.test.ts`:

```typescript
import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import { prisma } from "../../shared/db/client.js";

describe("POST /api/uploads/sign", () => {
  const email = "upload-test@djassa.test";

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  it("rejects unauthenticated requests", async () => {
    const res = await request(app).post("/api/uploads/sign");
    expect(res.status).toBe(401);
  });

  it("returns a signed payload for an authenticated vendor", async () => {
    const registerRes = await request(app)
      .post("/api/auth/register")
      .send({ email, password: "password123", accountType: "vendeur" });

    const res = await request(app)
      .post("/api/uploads/sign")
      .set("Authorization", `Bearer ${registerRes.body.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.signature).toBeDefined();
    expect(res.body.cloudName).toBeDefined();
    expect(res.body.folder).toContain(registerRes.body.user.id);
  });
});
```

- [ ] **Step 8: Run tests, type-check**

```bash
npx tsc --noEmit --pretty false
npx vitest run
```

Expected: no type errors, all tests pass.

- [ ] **Step 9: Commit**

```bash
git add backend/src/features/uploads backend/src/shared/config/index.ts backend/src/app.ts backend/.env.example backend/package.json backend/package-lock.json
git commit -m "feat: add signed Cloudinary upload endpoint"
```

---

### Task 3: CRUD produits (vendeur)

**Files:**
- Create: `backend/src/features/products/product.schema.ts`
- Create: `backend/src/features/products/product.service.ts`
- Create: `backend/src/features/products/product.controller.ts`
- Create: `backend/src/features/products/product.routes.ts`
- Modify: `backend/src/app.ts`
- Create: `backend/src/features/products/product.test.ts`

**Interfaces:**
- Consumes: `ProductRepository` (Task 1), `requireAuth` (Phase 1), `NotFoundError`/`ValidationError` (Phase 1)
- Produces: `productRouter` monté sur `/api/products` (privé, vendeur) — `POST /`, `GET /mine`, `PATCH /:id`, `DELETE /:id`.

- [ ] **Step 1: Schema de validation**

`backend/src/features/products/product.schema.ts`:

```typescript
import { z } from "zod";

const CATEGORIES = ["mode_beaute", "electronique", "maison", "telephones", "alimentation", "autre"] as const;

export const createProductSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(2000),
  price: z.number().int().positive(),
  category: z.enum(CATEGORIES),
  photos: z.array(z.string().url()).min(1).max(5),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
```

- [ ] **Step 2: Service (règles métier + ownership)**

`backend/src/features/products/product.service.ts`:

```typescript
import { ProductRepository } from "./product.repository.js";
import { NotFoundError, UnauthorizedError } from "../../shared/errors/index.js";
import type { CreateProductInput, UpdateProductInput } from "./product.schema.js";

const productRepo = new ProductRepository();

export const ProductService = {
  create(vendorId: string, input: CreateProductInput) {
    return productRepo.create({ vendorId, ...input });
  },

  listMine(vendorId: string) {
    return productRepo.findByVendor(vendorId);
  },

  async update(vendorId: string, productId: string, input: UpdateProductInput) {
    const existing = await productRepo.findById(productId);
    if (!existing) throw new NotFoundError("Produit");
    if (existing.vendorId !== vendorId) throw new UnauthorizedError("Ce produit ne vous appartient pas");
    return productRepo.update(productId, input);
  },

  async remove(vendorId: string, productId: string) {
    const existing = await productRepo.findById(productId);
    if (!existing) throw new NotFoundError("Produit");
    if (existing.vendorId !== vendorId) throw new UnauthorizedError("Ce produit ne vous appartient pas");
    await productRepo.delete(productId);
  },
};
```

- [ ] **Step 3: Controller**

`backend/src/features/products/product.controller.ts`:

```typescript
import type { Request, Response, NextFunction } from "express";
import { ProductService } from "./product.service.js";
import { createProductSchema, updateProductSchema } from "./product.schema.js";
import { ValidationError } from "../../shared/errors/index.js";

function fieldErrors(error: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } }) {
  const flat = error.flatten().fieldErrors;
  const result: Record<string, string> = {};
  for (const [key, messages] of Object.entries(flat)) {
    if (messages?.[0]) result[key] = messages[0];
  }
  return result;
}

export async function create(req: Request, res: Response, next: NextFunction) {
  const parsed = createProductSchema.safeParse(req.body);
  if (!parsed.success) return next(new ValidationError(fieldErrors(parsed.error)));

  try {
    const product = await ProductService.create(req.userId!, parsed.data);
    res.status(201).json({ product });
  } catch (err) {
    next(err);
  }
}

export async function listMine(req: Request, res: Response, next: NextFunction) {
  try {
    const products = await ProductService.listMine(req.userId!);
    res.json({ products });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  const parsed = updateProductSchema.safeParse(req.body);
  if (!parsed.success) return next(new ValidationError(fieldErrors(parsed.error)));

  try {
    const product = await ProductService.update(req.userId!, req.params.id, parsed.data);
    res.json({ product });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await ProductService.remove(req.userId!, req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
```

- [ ] **Step 4: Routes**

`backend/src/features/products/product.routes.ts`:

```typescript
import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { create, listMine, update, remove } from "./product.controller.js";

export const productRouter = Router();

productRouter.use(requireAuth);
productRouter.post("/", create);
productRouter.get("/mine", listMine);
productRouter.patch("/:id", update);
productRouter.delete("/:id", remove);
```

- [ ] **Step 5: Monter dans app.ts**

Modifier `backend/src/app.ts` :

```typescript
import { productRouter } from "./features/products/product.routes.js";
```

```typescript
app.use("/api/products", productRouter);
```

- [ ] **Step 6: Tests**

`backend/src/features/products/product.test.ts`:

```typescript
import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import { prisma } from "../../shared/db/client.js";

describe("Product CRUD", () => {
  const vendorEmail = "product-crud-vendor@djassa.test";
  const otherEmail = "product-crud-other@djassa.test";
  let vendorToken: string;
  let otherToken: string;
  let productId: string;

  afterAll(async () => {
    await prisma.product.deleteMany({ where: { vendor: { email: { in: [vendorEmail, otherEmail] } } } });
    await prisma.user.deleteMany({ where: { email: { in: [vendorEmail, otherEmail] } } });
    await prisma.$disconnect();
  });

  it("registers two vendors for the test", async () => {
    const vendorRes = await request(app)
      .post("/api/auth/register")
      .send({ email: vendorEmail, password: "password123", accountType: "vendeur" });
    vendorToken = vendorRes.body.accessToken;

    const otherRes = await request(app)
      .post("/api/auth/register")
      .send({ email: otherEmail, password: "password123", accountType: "vendeur" });
    otherToken = otherRes.body.accessToken;

    expect(vendorToken).toBeDefined();
    expect(otherToken).toBeDefined();
  });

  it("creates a product", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${vendorToken}`)
      .send({
        title: "Chaussures homme",
        description: "Chaussures en cuir véritable, pointure 42",
        price: 25000,
        category: "mode_beaute",
        photos: ["https://res.cloudinary.com/demo/image/upload/chaussures.jpg"],
      });

    expect(res.status).toBe(201);
    productId = res.body.product.id;
  });

  it("lists the vendor's own products", async () => {
    const res = await request(app).get("/api/products/mine").set("Authorization", `Bearer ${vendorToken}`);
    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(1);
  });

  it("rejects updates from a non-owner vendor", async () => {
    const res = await request(app)
      .patch(`/api/products/${productId}`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ price: 1 });

    expect(res.status).toBe(401);
  });

  it("allows the owner to update their product", async () => {
    const res = await request(app)
      .patch(`/api/products/${productId}`)
      .set("Authorization", `Bearer ${vendorToken}`)
      .send({ price: 22000 });

    expect(res.status).toBe(200);
    expect(res.body.product.price).toBe(22000);
  });

  it("allows the owner to delete their product", async () => {
    const res = await request(app).delete(`/api/products/${productId}`).set("Authorization", `Bearer ${vendorToken}`);
    expect(res.status).toBe(204);
  });
});
```

- [ ] **Step 7: Run tests + type-check**

```bash
npx tsc --noEmit --pretty false
npx vitest run
```

Expected: no errors, all tests pass.

- [ ] **Step 8: Commit**

```bash
git add backend/src/features/products backend/src/app.ts
git commit -m "feat: add vendor product CRUD endpoints"
```

---

### Task 4: Flux public de découverte

**Files:**
- Create: `backend/src/features/products/public.routes.ts`
- Modify: `backend/src/app.ts`
- Test: `backend/src/features/products/public.test.ts`

**Interfaces:**
- Consumes: `ProductRepository.findPublic` (Task 1)
- Produces: `publicProductRouter` monté sur `/api/public/products`, endpoint `GET /` (pas d'auth) — query params `category?`, `cursor?`, `limit?` (défaut 20, max 50).

- [ ] **Step 1: Route publique**

`backend/src/features/products/public.routes.ts`:

```typescript
import { Router } from "express";
import { ProductRepository } from "./product.repository.js";

const productRepo = new ProductRepository();
export const publicProductRouter = Router();

publicProductRouter.get("/", async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const category = typeof req.query.category === "string" ? req.query.category : undefined;
    const cursor = typeof req.query.cursor === "string" ? req.query.cursor : undefined;

    const products = await productRepo.findPublic({
      category: category as never,
      cursor,
      limit,
    });
    res.json({ products });
  } catch (err) {
    next(err);
  }
});
```

- [ ] **Step 2: Monter dans app.ts**

Modifier `backend/src/app.ts` :

```typescript
import { publicProductRouter } from "./features/products/public.routes.js";
```

```typescript
app.use("/api/public/products", publicProductRouter);
```

- [ ] **Step 3: Test**

`backend/src/features/products/public.test.ts`:

```typescript
import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import { prisma } from "../../shared/db/client.js";

describe("GET /api/public/products", () => {
  const email = "public-feed-vendor@djassa.test";
  let productId: string;

  afterAll(async () => {
    await prisma.product.deleteMany({ where: { vendor: { email } } });
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  it("returns products without authentication", async () => {
    const regRes = await request(app)
      .post("/api/auth/register")
      .send({ email, password: "password123", accountType: "vendeur" });

    const createRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${regRes.body.accessToken}`)
      .send({
        title: "Sac à main",
        description: "Sac à main en cuir, plusieurs coloris disponibles",
        price: 18000,
        category: "mode_beaute",
        photos: ["https://res.cloudinary.com/demo/image/upload/sac.jpg"],
      });
    productId = createRes.body.product.id;

    const res = await request(app).get("/api/public/products");
    expect(res.status).toBe(200);
    expect(res.body.products.some((p: { id: string }) => p.id === productId)).toBe(true);
  });

  it("filters by category", async () => {
    const res = await request(app).get("/api/public/products?category=electronique");
    expect(res.status).toBe(200);
    expect(res.body.products.every((p: { category: string }) => p.category === "electronique")).toBe(true);
  });
});
```

- [ ] **Step 4: Run tests + type-check + build**

```bash
npx tsc --noEmit --pretty false
npx vitest run
npm run build
```

Expected: no errors, all tests pass, build succeeds.

- [ ] **Step 5: Commit**

```bash
git add backend/src/features/products/public.routes.ts backend/src/features/products/public.test.ts backend/src/app.ts
git commit -m "feat: add public product discovery feed"
```

---

### Task 5: Frontend — catalogue vendeur + upload photo

**Files:**
- Create: `frontend/src/api/products.ts`
- Create: `frontend/src/components/ProductForm.tsx`
- Create: `frontend/src/pages/Catalogue.tsx`
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- Consumes: `apiClient` (Phase 1, `api/client.ts`), backend `POST /api/uploads/sign`, `POST /api/products`, `GET /api/products/mine`.
- Produces: route `/catalogue` (protégée), composant `<ProductForm onCreated={...} />`.

- [ ] **Step 1: API helpers typés**

`frontend/src/api/products.ts`:

```typescript
import { apiClient } from "./client";

export type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  photos: string[];
  createdAt: string;
};

type SignedUpload = { cloudName: string; apiKey: string; timestamp: number; signature: string; folder: string };

export const productsApi = {
  listMine: () => apiClient.get<{ products: Product[] }>("/api/products/mine"),
  create: (data: Omit<Product, "id" | "createdAt">) =>
    apiClient.post<{ product: Product }>("/api/products", data),
  signUpload: () => apiClient.post<SignedUpload>("/api/uploads/sign", {}),
};

export async function uploadPhoto(file: File): Promise<string> {
  const signed = await productsApi.signUpload();
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signed.apiKey);
  formData.append("timestamp", String(signed.timestamp));
  formData.append("signature", signed.signature);
  formData.append("folder", signed.folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Échec de l'upload de la photo");
  const body = await res.json();
  return body.secure_url as string;
}
```

- [ ] **Step 2: Formulaire produit**

`frontend/src/components/ProductForm.tsx`:

```tsx
import { useState, type FormEvent } from "react";
import { productsApi, uploadPhoto, type Product } from "../api/products";

const CATEGORIES = [
  { value: "mode_beaute", label: "Mode & Beauté" },
  { value: "electronique", label: "Électronique" },
  { value: "maison", label: "Maison & Vie quotidienne" },
  { value: "telephones", label: "Téléphones & Accessoires" },
  { value: "alimentation", label: "Alimentation" },
  { value: "autre", label: "Autre" },
];

export function ProductForm({ onCreated }: { onCreated: (product: Product) => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0].value);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!photoFile) {
      setError("Ajoute au moins une photo");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const photoUrl = await uploadPhoto(photoFile);
      const { product } = await productsApi.create({
        title,
        description,
        price: Number(price),
        category,
        photos: [photoUrl],
      });
      onCreated(product);
      setTitle("");
      setDescription("");
      setPrice("");
      setPhotoFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la création du produit");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Ajouter un produit</h2>
      {error && <p role="alert">{error}</p>}
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre" required />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
        required
      />
      <input
        type="number"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="Prix (FCFA)"
        required
      />
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        {CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>
      <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)} required />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Publication..." : "Publier"}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Page catalogue**

`frontend/src/pages/Catalogue.tsx`:

```tsx
import { useEffect, useState } from "react";
import { productsApi, type Product } from "../api/products";
import { ProductForm } from "../components/ProductForm";

export function Catalogue() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    productsApi
      .listMine()
      .then((res) => setProducts(res.products))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div>
      <h1>Mon catalogue</h1>
      <ProductForm onCreated={(product) => setProducts((prev) => [product, ...prev])} />
      {isLoading ? (
        <p>Chargement...</p>
      ) : (
        <ul>
          {products.map((p) => (
            <li key={p.id}>
              {p.title} — {p.price} FCFA
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Ajouter la route**

Modifier `frontend/src/App.tsx` — ajouter l'import et la route protégée :

```typescript
import { Catalogue } from "./pages/Catalogue";
```

```tsx
          <Route
            path="/catalogue"
            element={
              <PrivateRoute>
                <Catalogue />
              </PrivateRoute>
            }
          />
```
(à ajouter juste après la route `/tableau-de-bord`)

- [ ] **Step 5: Build check**

```bash
cd frontend
npm run build
```

Expected: compiles without errors.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/api/products.ts frontend/src/components/ProductForm.tsx frontend/src/pages/Catalogue.tsx frontend/src/App.tsx
git commit -m "feat: add vendor catalogue page with photo upload"
```

---

### Task 6: Frontend — marché public

**Files:**
- Create: `frontend/src/pages/Marche.tsx`
- Create: `frontend/src/components/ProductCard.tsx`
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- Consumes: backend `GET /api/public/products` (pas d'auth).
- Produces: route `/marche` (publique, pas de `PrivateRoute`).

- [ ] **Step 1: Carte produit**

`frontend/src/components/ProductCard.tsx`:

```tsx
import type { Product } from "../api/products";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article>
      {product.photos[0] && <img src={product.photos[0]} alt={product.title} width={200} />}
      <h3>{product.title}</h3>
      <p>{product.price.toLocaleString("fr-FR")} FCFA</p>
    </article>
  );
}
```

- [ ] **Step 2: Page marché**

`frontend/src/pages/Marche.tsx`:

```tsx
import { useEffect, useState } from "react";
import { apiClient } from "../api/client";
import type { Product } from "../api/products";
import { ProductCard } from "../components/ProductCard";

const CATEGORIES = [
  { value: "", label: "Toutes catégories" },
  { value: "mode_beaute", label: "Mode & Beauté" },
  { value: "electronique", label: "Électronique" },
  { value: "maison", label: "Maison & Vie quotidienne" },
  { value: "telephones", label: "Téléphones & Accessoires" },
  { value: "alimentation", label: "Alimentation" },
  { value: "autre", label: "Autre" },
];

export function Marche() {
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const query = category ? `?category=${category}` : "";
    apiClient
      .get<{ products: Product[] }>(`/api/public/products${query}`)
      .then((res) => setProducts(res.products))
      .finally(() => setIsLoading(false));
  }, [category]);

  return (
    <div>
      <h1>Marché DJASSA</h1>
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        {CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>
      {isLoading ? (
        <p>Chargement...</p>
      ) : (
        <div>
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Ajouter la route publique**

Modifier `frontend/src/App.tsx` :

```typescript
import { Marche } from "./pages/Marche";
```

```tsx
          <Route path="/marche" element={<Marche />} />
```
(en dehors de `PrivateRoute`, accessible sans connexion)

- [ ] **Step 4: Build check final**

```bash
cd frontend
npm run build
cd ../backend
npm run build
npx vitest run
```

Expected: les deux builds passent, tous les tests backend passent.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/Marche.tsx frontend/src/components/ProductCard.tsx frontend/src/App.tsx
git commit -m "feat: add public marketplace browse page"
```

---

## Self-Review Notes

- **Spec coverage :** ce plan couvre uniquement le catalogue produit + upload photo. L'escrow/commandes (Phase 4), le chat (Phase 3), la vérification vendeur et le score de confiance (Phase 5) restent hors scope, comme prévu dans le découpage validé avec l'utilisateur.
- **Placeholder scan :** aucun TBD/TODO ; la note sur les identifiants Cloudinary factices (Task 2 Step 6) est une contrainte légitime documentée, pas un trou.
- **Type consistency :** `Product` (id, title, description, price, category, photos, createdAt) cohérent entre `product.repository.ts` (Task 1), les réponses controller (Task 3/4) et `frontend/src/api/products.ts` (Task 5). `req.userId!` suit le pattern déjà établi en Phase 1 (`auth.middleware.ts` peuple `req.userId` avant tout handler protégé).
- **Ownership scoping :** `ProductService.update`/`remove` vérifient `existing.vendorId !== vendorId` avant toute mutation — reconduit la convention "ownership scoping" du projet précédent.
