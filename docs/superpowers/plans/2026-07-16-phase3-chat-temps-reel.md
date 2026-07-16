# Phase 3 — Chat temps réel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Un acheteur peut démarrer une conversation sur un produit, échanger des messages en temps réel avec le vendeur, et faire une offre de prix formelle — base de la future acceptation de commande (Phase 4).

**Architecture:** Deux modèles Prisma (`Conversation` unique par triple `buyer`+`vendor`+`product`, `ChatMessage` avec `offerPrice` nullable). API REST pour l'historique/bootstrap + Socket.IO pour la livraison temps réel des nouveaux messages. Le handshake Socket.IO s'authentifie avec le même JWT access token que le REST (pas de système d'auth séparé).

**Tech Stack:** Ajoute `socket.io` (serveur) et `socket.io-client` (frontend) à la stack Phase 1/2.

## Global Constraints

- Un vendeur ne peut pas démarrer de conversation sur son propre produit (vérifié service layer).
- Ownership/participation scoping : toute lecture/écriture de conversation vérifie que l'utilisateur courant est `buyerId` ou `vendorId` de cette conversation — jamais de requête qui saute ce filtre.
- Prix d'offre en FCFA, entier, cohérent avec `Product.price`.
- Le handshake Socket.IO réutilise le JWT access token (`Authorization`-equivalent passé en `auth.token` du client Socket.IO), pas de session séparée.

---

## File Structure

```
backend/
  prisma/schema.prisma          # + model Conversation, model ChatMessage
  src/
    services/
      realtime.ts                # Socket.IO server setup, emitToUser()
    features/
      conversations/
        conversation.schema.ts
        conversation.repository.ts
        message.repository.ts
        conversation.service.ts
        conversation.controller.ts
        conversation.routes.ts
        conversation.test.ts
    server.ts                    # modifié : http.createServer + Socket.IO attaché

frontend/
  src/
    realtime/
      socket.ts                  # connexion socket.io-client authentifiée
    api/conversations.ts
    pages/
      Messagerie.tsx              # liste conversations + fil de discussion actif
    components/
      ConversationThread.tsx
      MessageComposer.tsx
```

---

### Task 1: Modèles Conversation + ChatMessage

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Create: `backend/src/features/conversations/conversation.repository.ts`
- Create: `backend/src/features/conversations/message.repository.ts`
- Test: `backend/src/features/conversations/conversation.repository.test.ts`

**Interfaces:**
- Consumes: `prisma` singleton, `User`/`Product` models (Phases 1-2)
- Produces: `ConversationRepository` (`findOrCreate(buyerId, vendorId, productId)`, `findById(id)`, `findByParticipant(userId)`), `MessageRepository` (`create(data)`, `findByConversation(conversationId)`). Type `Conversation = { id, buyerId, vendorId, productId, createdAt }`, `ChatMessage = { id, conversationId, senderId, text, offerPrice: number | null, createdAt }`.

- [ ] **Step 1: Étendre le schema Prisma**

Ajouter à `backend/prisma/schema.prisma` :

```prisma
model Conversation {
  id        String        @id @default(uuid())
  buyerId   String
  buyer     User          @relation("BuyerConversations", fields: [buyerId], references: [id])
  vendorId  String
  vendor    User          @relation("VendorConversations", fields: [vendorId], references: [id])
  productId String
  product   Product       @relation(fields: [productId], references: [id])
  messages  ChatMessage[]
  createdAt DateTime      @default(now())

  @@unique([buyerId, vendorId, productId])
}

model ChatMessage {
  id             String       @id @default(uuid())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id])
  senderId       String
  sender         User         @relation(fields: [senderId], references: [id])
  text           String
  offerPrice     Int?
  createdAt      DateTime     @default(now())
}
```

Ajouter les relations inverses sur `User` :

```prisma
model User {
  # ... champs existants inchangés ...
  buyerConversations  Conversation[] @relation("BuyerConversations")
  vendorConversations Conversation[] @relation("VendorConversations")
  messages            ChatMessage[]
}
```

Ajouter la relation inverse sur `Product` :

```prisma
model Product {
  # ... champs existants inchangés ...
  conversations Conversation[]
}
```

- [ ] **Step 2: Générer et appliquer la migration**

```bash
cd backend
npx prisma migrate dev --name add_conversation_chat
```

Expected: migration créée et appliquée, client régénéré.

- [ ] **Step 3: ConversationRepository**

`backend/src/features/conversations/conversation.repository.ts`:

```typescript
import { prisma } from "../../shared/db/client.js";
import type { Conversation } from "@prisma/client";

export class ConversationRepository {
  async findOrCreate(buyerId: string, vendorId: string, productId: string): Promise<Conversation> {
    const existing = await prisma.conversation.findUnique({
      where: { buyerId_vendorId_productId: { buyerId, vendorId, productId } },
    });
    if (existing) return existing;
    return prisma.conversation.create({ data: { buyerId, vendorId, productId } });
  }

  findById(id: string): Promise<Conversation | null> {
    return prisma.conversation.findUnique({ where: { id } });
  }

  findByParticipant(userId: string): Promise<Conversation[]> {
    return prisma.conversation.findMany({
      where: { OR: [{ buyerId: userId }, { vendorId: userId }] },
      orderBy: { createdAt: "desc" },
      include: { product: true },
    });
  }
}
```

- [ ] **Step 4: MessageRepository**

`backend/src/features/conversations/message.repository.ts`:

```typescript
import { prisma } from "../../shared/db/client.js";
import type { ChatMessage } from "@prisma/client";

export class MessageRepository {
  create(data: { conversationId: string; senderId: string; text: string; offerPrice?: number | null }): Promise<ChatMessage> {
    return prisma.chatMessage.create({ data });
  }

  findByConversation(conversationId: string): Promise<ChatMessage[]> {
    return prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });
  }
}
```

- [ ] **Step 5: Test des repositories**

`backend/src/features/conversations/conversation.repository.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { ConversationRepository } from "./conversation.repository.js";
import { MessageRepository } from "./message.repository.js";
import { UserRepository } from "../users/user.repository.js";
import { ProductRepository } from "../products/product.repository.js";
import { prisma } from "../../shared/db/client.js";

const conversationRepo = new ConversationRepository();
const messageRepo = new MessageRepository();
const userRepo = new UserRepository();
const productRepo = new ProductRepository();

let buyerId: string;
let vendorId: string;
let productId: string;

describe("ConversationRepository + MessageRepository", () => {
  beforeAll(async () => {
    const buyer = await userRepo.create({ email: "conv-buyer@djassa.test", passwordHash: "x", accountType: "client" });
    const vendor = await userRepo.create({ email: "conv-vendor@djassa.test", passwordHash: "x", accountType: "vendeur" });
    buyerId = buyer.id;
    vendorId = vendor.id;

    const product = await productRepo.create({
      vendorId,
      title: "Montre",
      description: "Montre connectée, garantie 1 an",
      price: 30000,
      category: "electronique",
      photos: ["https://res.cloudinary.com/demo/image/upload/montre.jpg"],
    });
    productId = product.id;
  });

  afterAll(async () => {
    await prisma.chatMessage.deleteMany({ where: { conversation: { buyerId } } });
    await prisma.conversation.deleteMany({ where: { buyerId } });
    await prisma.product.deleteMany({ where: { vendorId } });
    await prisma.user.deleteMany({ where: { id: { in: [buyerId, vendorId] } } });
    await prisma.$disconnect();
  });

  it("creates a conversation once and returns the same one on repeat calls", async () => {
    const first = await conversationRepo.findOrCreate(buyerId, vendorId, productId);
    const second = await conversationRepo.findOrCreate(buyerId, vendorId, productId);
    expect(second.id).toBe(first.id);
  });

  it("stores and retrieves messages in order", async () => {
    const conversation = await conversationRepo.findOrCreate(buyerId, vendorId, productId);
    await messageRepo.create({ conversationId: conversation.id, senderId: buyerId, text: "Bonjour, dispo ?" });
    await messageRepo.create({
      conversationId: conversation.id,
      senderId: vendorId,
      text: "Oui, je peux faire 28000",
      offerPrice: 28000,
    });

    const messages = await messageRepo.findByConversation(conversation.id);
    expect(messages).toHaveLength(2);
    expect(messages[1].offerPrice).toBe(28000);
  });

  it("lists conversations by participant", async () => {
    const list = await conversationRepo.findByParticipant(buyerId);
    expect(list.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 6: Run tests**

```bash
npx vitest run src/features/conversations/conversation.repository.test.ts
```

Expected: 3 passed.

- [ ] **Step 7: Commit**

```bash
git add backend/prisma backend/src/features/conversations/conversation.repository.ts backend/src/features/conversations/message.repository.ts backend/src/features/conversations/conversation.repository.test.ts
git commit -m "feat: add Conversation and ChatMessage models"
```

---

### Task 2: Socket.IO server + auth handshake

**Files:**
- Create: `backend/src/services/realtime.ts`
- Modify: `backend/src/server.ts`

**Interfaces:**
- Consumes: `config.jwt.accessSecret` (Phase 1)
- Produces: `initRealtime(httpServer)` → configure le serveur Socket.IO, authentifie chaque connexion via `socket.handshake.auth.token` (même JWT access token que le REST). `emitToUser(userId, event, payload)` — émet vers la room `user:<id>` (tous les onglets/appareils connectés de cet utilisateur la reçoivent).

- [ ] **Step 1: Installer Socket.IO**

```bash
cd backend
npm install socket.io
```

- [ ] **Step 2: Écrire le service realtime**

`backend/src/services/realtime.ts`:

```typescript
import type { Server as HttpServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import jwt from "jsonwebtoken";
import { config } from "../shared/config/index.js";
import { logger } from "../shared/logger/index.js";

let io: SocketIOServer | undefined;

export function initRealtime(httpServer: HttpServer) {
  io = new SocketIOServer(httpServer, {
    cors: { origin: config.corsOrigin, credentials: true },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;
    if (!token) return next(new Error("Authentification requise"));

    try {
      const payload = jwt.verify(token, config.jwt.accessSecret) as { userId: string };
      socket.data.userId = payload.userId;
      next();
    } catch {
      next(new Error("Session invalide"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId as string;
    socket.join(`user:${userId}`);
    logger.debug({ userId, socketId: socket.id }, "Socket connecté");
  });

  return io;
}

export function emitToUser(userId: string, event: string, payload: unknown) {
  io?.to(`user:${userId}`).emit(event, payload);
}
```

- [ ] **Step 3: Modifier server.ts pour attacher Socket.IO au serveur HTTP**

`backend/src/server.ts` (remplacer le contenu) :

```typescript
import "dotenv/config";
import { createServer } from "node:http";
import { app } from "./app.js";
import { config } from "./shared/config/index.js";
import { logger } from "./shared/logger/index.js";
import { initRealtime } from "./services/realtime.js";

const httpServer = createServer(app);
initRealtime(httpServer);

httpServer.listen(config.port, () => {
  logger.info({ port: config.port }, "Serveur démarré");
});

process.on("SIGTERM", () => {
  logger.info("SIGTERM reçu, arrêt en cours");
  httpServer.close(() => process.exit(0));
});
```

- [ ] **Step 4: Build check**

```bash
cd backend
npx tsc --noEmit --pretty false
npm run build
```

Expected: no type errors, build succeeds.

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/realtime.ts backend/src/server.ts backend/package.json backend/package-lock.json
git commit -m "feat: add Socket.IO real-time server with JWT handshake auth"
```

---

### Task 3: API conversations + messages (REST) + émission temps réel

**Files:**
- Create: `backend/src/features/conversations/conversation.schema.ts`
- Create: `backend/src/features/conversations/conversation.service.ts`
- Create: `backend/src/features/conversations/conversation.controller.ts`
- Create: `backend/src/features/conversations/conversation.routes.ts`
- Modify: `backend/src/app.ts`
- Create: `backend/src/features/conversations/conversation.test.ts`

**Interfaces:**
- Consumes: `ConversationRepository`/`MessageRepository` (Task 1), `emitToUser` (Task 2), `ProductRepository` (Phase 2), `requireAuth` (Phase 1)
- Produces: `conversationRouter` monté sur `/api/conversations` — `POST /` (démarrer/récupérer une conversation sur un produit), `GET /mine`, `GET /:id/messages`, `POST /:id/messages`. Émet l'événement Socket.IO `message:new` au destinataire à chaque nouveau message.

- [ ] **Step 1: Schema de validation**

`backend/src/features/conversations/conversation.schema.ts`:

```typescript
import { z } from "zod";

export const startConversationSchema = z.object({
  productId: z.string().uuid(),
});

export const sendMessageSchema = z.object({
  text: z.string().min(1).max(2000),
  offerPrice: z.number().int().positive().optional(),
});

export type StartConversationInput = z.infer<typeof startConversationSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
```

- [ ] **Step 2: Service**

`backend/src/features/conversations/conversation.service.ts`:

```typescript
import { ConversationRepository } from "./conversation.repository.js";
import { MessageRepository } from "./message.repository.js";
import { ProductRepository } from "../products/product.repository.js";
import { NotFoundError, UnauthorizedError, ValidationError } from "../../shared/errors/index.js";
import { emitToUser } from "../../services/realtime.js";
import type { SendMessageInput } from "./conversation.schema.js";

const conversationRepo = new ConversationRepository();
const messageRepo = new MessageRepository();
const productRepo = new ProductRepository();

function assertParticipant(conversation: { buyerId: string; vendorId: string }, userId: string) {
  if (conversation.buyerId !== userId && conversation.vendorId !== userId) {
    throw new UnauthorizedError("Vous ne participez pas à cette conversation");
  }
}

export const ConversationService = {
  async start(buyerId: string, productId: string) {
    const product = await productRepo.findById(productId);
    if (!product) throw new NotFoundError("Produit");
    if (product.vendorId === buyerId) {
      throw new ValidationError({ productId: "Vous ne pouvez pas démarrer une conversation sur votre propre produit" });
    }
    return conversationRepo.findOrCreate(buyerId, product.vendorId, productId);
  },

  listMine(userId: string) {
    return conversationRepo.findByParticipant(userId);
  },

  async listMessages(userId: string, conversationId: string) {
    const conversation = await conversationRepo.findById(conversationId);
    if (!conversation) throw new NotFoundError("Conversation");
    assertParticipant(conversation, userId);
    return messageRepo.findByConversation(conversationId);
  },

  async sendMessage(userId: string, conversationId: string, input: SendMessageInput) {
    const conversation = await conversationRepo.findById(conversationId);
    if (!conversation) throw new NotFoundError("Conversation");
    assertParticipant(conversation, userId);

    const message = await messageRepo.create({
      conversationId,
      senderId: userId,
      text: input.text,
      offerPrice: input.offerPrice ?? null,
    });

    const recipientId = conversation.buyerId === userId ? conversation.vendorId : conversation.buyerId;
    emitToUser(recipientId, "message:new", { conversationId, message });

    return message;
  },
};
```

- [ ] **Step 3: Controller**

`backend/src/features/conversations/conversation.controller.ts`:

```typescript
import type { Request, Response, NextFunction } from "express";
import { ConversationService } from "./conversation.service.js";
import { startConversationSchema, sendMessageSchema } from "./conversation.schema.js";
import { ValidationError } from "../../shared/errors/index.js";

function fieldErrors(error: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } }) {
  const flat = error.flatten().fieldErrors;
  const result: Record<string, string> = {};
  for (const [key, messages] of Object.entries(flat)) {
    if (messages?.[0]) result[key] = messages[0];
  }
  return result;
}

export async function start(req: Request, res: Response, next: NextFunction) {
  const parsed = startConversationSchema.safeParse(req.body);
  if (!parsed.success) return next(new ValidationError(fieldErrors(parsed.error)));

  try {
    const conversation = await ConversationService.start(req.userId!, parsed.data.productId);
    res.status(201).json({ conversation });
  } catch (err) {
    next(err);
  }
}

export async function listMine(req: Request, res: Response, next: NextFunction) {
  try {
    const conversations = await ConversationService.listMine(req.userId!);
    res.json({ conversations });
  } catch (err) {
    next(err);
  }
}

export async function listMessages(req: Request, res: Response, next: NextFunction) {
  try {
    const messages = await ConversationService.listMessages(req.userId!, req.params.id as string);
    res.json({ messages });
  } catch (err) {
    next(err);
  }
}

export async function sendMessage(req: Request, res: Response, next: NextFunction) {
  const parsed = sendMessageSchema.safeParse(req.body);
  if (!parsed.success) return next(new ValidationError(fieldErrors(parsed.error)));

  try {
    const message = await ConversationService.sendMessage(req.userId!, req.params.id as string, parsed.data);
    res.status(201).json({ message });
  } catch (err) {
    next(err);
  }
}
```

- [ ] **Step 4: Routes**

`backend/src/features/conversations/conversation.routes.ts`:

```typescript
import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { start, listMine, listMessages, sendMessage } from "./conversation.controller.js";

export const conversationRouter = Router();

conversationRouter.use(requireAuth);
conversationRouter.post("/", start);
conversationRouter.get("/mine", listMine);
conversationRouter.get("/:id/messages", listMessages);
conversationRouter.post("/:id/messages", sendMessage);
```

- [ ] **Step 5: Monter dans app.ts**

Modifier `backend/src/app.ts` :

```typescript
import { conversationRouter } from "./features/conversations/conversation.routes.js";
```

```typescript
app.use("/api/conversations", conversationRouter);
```

- [ ] **Step 6: Tests**

`backend/src/features/conversations/conversation.test.ts`:

```typescript
import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import { prisma } from "../../shared/db/client.js";

describe("Conversations", () => {
  const buyerEmail = "chat-buyer@djassa.test";
  const vendorEmail = "chat-vendor@djassa.test";
  let buyerToken: string;
  let vendorToken: string;
  let vendorId: string;
  let productId: string;
  let conversationId: string;

  afterAll(async () => {
    await prisma.chatMessage.deleteMany({ where: { conversation: { buyerId: { not: undefined } } } });
    await prisma.conversation.deleteMany({ where: { vendorId } });
    await prisma.product.deleteMany({ where: { vendorId } });
    await prisma.user.deleteMany({ where: { email: { in: [buyerEmail, vendorEmail] } } });
    await prisma.$disconnect();
  });

  it("sets up a buyer, a vendor and a product", async () => {
    const buyerRes = await request(app)
      .post("/api/auth/register")
      .send({ email: buyerEmail, password: "password123", accountType: "client" });
    buyerToken = buyerRes.body.accessToken;

    const vendorRes = await request(app)
      .post("/api/auth/register")
      .send({ email: vendorEmail, password: "password123", accountType: "vendeur" });
    vendorToken = vendorRes.body.accessToken;
    vendorId = vendorRes.body.user.id;

    const productRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${vendorToken}`)
      .send({
        title: "Casque audio",
        description: "Casque bluetooth, autonomie 20h",
        price: 12000,
        category: "electronique",
        photos: ["https://res.cloudinary.com/demo/image/upload/casque.jpg"],
      });
    productId = productRes.body.product.id;

    expect(buyerToken).toBeDefined();
    expect(productId).toBeDefined();
  });

  it("rejects a vendor starting a conversation on their own product", async () => {
    const res = await request(app)
      .post("/api/conversations")
      .set("Authorization", `Bearer ${vendorToken}`)
      .send({ productId });

    expect(res.status).toBe(422);
  });

  it("lets a buyer start a conversation", async () => {
    const res = await request(app)
      .post("/api/conversations")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ productId });

    expect(res.status).toBe(201);
    conversationId = res.body.conversation.id;
  });

  it("returns the same conversation on a repeat start call", async () => {
    const res = await request(app)
      .post("/api/conversations")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ productId });

    expect(res.body.conversation.id).toBe(conversationId);
  });

  it("lets the buyer send a message with a price offer", async () => {
    const res = await request(app)
      .post(`/api/conversations/${conversationId}/messages`)
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ text: "Je propose 10000", offerPrice: 10000 });

    expect(res.status).toBe(201);
    expect(res.body.message.offerPrice).toBe(10000);
  });

  it("lets the vendor read the message history", async () => {
    const res = await request(app)
      .get(`/api/conversations/${conversationId}/messages`)
      .set("Authorization", `Bearer ${vendorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.messages).toHaveLength(1);
  });

  it("rejects a third party from reading the conversation", async () => {
    const outsiderRes = await request(app)
      .post("/api/auth/register")
      .send({ email: "chat-outsider@djassa.test", password: "password123", accountType: "client" });

    const res = await request(app)
      .get(`/api/conversations/${conversationId}/messages`)
      .set("Authorization", `Bearer ${outsiderRes.body.accessToken}`);

    expect(res.status).toBe(401);
    await prisma.user.deleteMany({ where: { email: "chat-outsider@djassa.test" } });
  });

  it("lists the buyer's conversations", async () => {
    const res = await request(app).get("/api/conversations/mine").set("Authorization", `Bearer ${buyerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.conversations.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 7: Run tests, type-check, build**

```bash
cd backend
npx tsc --noEmit --pretty false
npx vitest run
npm run build
```

Expected: no errors, all tests pass, build succeeds.

- [ ] **Step 8: Commit**

```bash
git add backend/src/features/conversations backend/src/app.ts
git commit -m "feat: add conversation REST API with real-time message delivery"
```

---

### Task 4: Frontend — connexion Socket.IO + page Messagerie

**Files:**
- Create: `frontend/src/realtime/socket.ts`
- Create: `frontend/src/api/conversations.ts`
- Create: `frontend/src/components/MessageComposer.tsx`
- Create: `frontend/src/components/ConversationThread.tsx`
- Create: `frontend/src/pages/Messagerie.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/context/AuthContext.tsx`
- Modify: `frontend/package.json` (ajout dépendance)

**Interfaces:**
- Consumes: `apiClient` (Phase 1), backend `/api/conversations/*`, événement Socket.IO `message:new`.
- Produces: route `/messagerie` (protégée), `useAuth()` expose désormais aussi l'`accessToken` courant (nécessaire pour le handshake Socket.IO).

- [ ] **Step 1: Installer socket.io-client**

```bash
cd frontend
npm install socket.io-client
```

- [ ] **Step 2: Exposer l'accessToken depuis AuthContext**

Modifier `frontend/src/context/AuthContext.tsx` — le contexte a déjà `accessToken` en variable de module dans `api/client.ts` mais pas dans le contexte React. Ajouter un state local synchronisé :

Remplacer la déclaration du type et l'implémentation :

```typescript
type AuthContextValue = {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, accountType: AccountType) => Promise<void>;
  logout: () => void;
};
```

Dans `AuthProvider`, ajouter `const [accessToken, setAccessTokenState] = useState<string | null>(null);` et, à chaque endroit où `setAccessToken(...)` (le helper du client API) est appelé, appeler aussi `setAccessTokenState(...)` avec la même valeur. Ajouter `accessToken` à la valeur du provider :

```tsx
return (
  <AuthContext.Provider value={{ user, accessToken, isLoading, login, register, logout }}>
    {children}
  </AuthContext.Provider>
);
```

Et dans `logout`, `login`, `register`, `restoreSession`, appeler `setAccessTokenState` en miroir de chaque `setAccessToken` déjà présent.

- [ ] **Step 3: Client Socket.IO**

`frontend/src/realtime/socket.ts`:

```typescript
import { io, type Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

let socket: Socket | null = null;

export function connectSocket(accessToken: string): Socket {
  if (socket) socket.disconnect();
  socket = io(SOCKET_URL, { auth: { token: accessToken } });
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
```

- [ ] **Step 4: API conversations**

`frontend/src/api/conversations.ts`:

```typescript
import { apiClient } from "./client";

export type Conversation = {
  id: string;
  buyerId: string;
  vendorId: string;
  productId: string;
  product: { title: string; photos: string[] };
  createdAt: string;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  offerPrice: number | null;
  createdAt: string;
};

export const conversationsApi = {
  start: (productId: string) => apiClient.post<{ conversation: Conversation }>("/api/conversations", { productId }),
  listMine: () => apiClient.get<{ conversations: Conversation[] }>("/api/conversations/mine"),
  listMessages: (conversationId: string) =>
    apiClient.get<{ messages: ChatMessage[] }>(`/api/conversations/${conversationId}/messages`),
  sendMessage: (conversationId: string, text: string, offerPrice?: number) =>
    apiClient.post<{ message: ChatMessage }>(`/api/conversations/${conversationId}/messages`, { text, offerPrice }),
};
```

- [ ] **Step 5: Composant de saisie de message**

`frontend/src/components/MessageComposer.tsx`:

```tsx
import { useState, type FormEvent } from "react";

export function MessageComposer({
  onSend,
}: {
  onSend: (text: string, offerPrice?: number) => Promise<void>;
}) {
  const [text, setText] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [isSending, setIsSending] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setIsSending(true);
    try {
      await onSend(text, offerPrice ? Number(offerPrice) : undefined);
      setText("");
      setOfferPrice("");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Message" required />
      <input
        type="number"
        value={offerPrice}
        onChange={(e) => setOfferPrice(e.target.value)}
        placeholder="Offre de prix (FCFA, optionnel)"
      />
      <button type="submit" disabled={isSending}>
        Envoyer
      </button>
    </form>
  );
}
```

- [ ] **Step 6: Fil de discussion**

`frontend/src/components/ConversationThread.tsx`:

```tsx
import type { ChatMessage } from "../api/conversations";

export function ConversationThread({ messages, currentUserId }: { messages: ChatMessage[]; currentUserId: string }) {
  return (
    <div>
      {messages.map((m) => (
        <p key={m.id} style={{ textAlign: m.senderId === currentUserId ? "right" : "left" }}>
          {m.text}
          {m.offerPrice !== null && <strong> — Offre : {m.offerPrice.toLocaleString("fr-FR")} FCFA</strong>}
        </p>
      ))}
    </div>
  );
}
```

- [ ] **Step 7: Page Messagerie**

`frontend/src/pages/Messagerie.tsx`:

```tsx
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { connectSocket, disconnectSocket } from "../realtime/socket";
import { conversationsApi, type Conversation, type ChatMessage } from "../api/conversations";
import { ConversationThread } from "../components/ConversationThread";
import { MessageComposer } from "../components/MessageComposer";

export function Messagerie() {
  const { user, accessToken } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    conversationsApi.listMine().then((res) => {
      setConversations(res.conversations);
      if (res.conversations.length > 0) setActiveId(res.conversations[0].id);
    });
  }, []);

  useEffect(() => {
    if (!activeId) return;
    conversationsApi.listMessages(activeId).then((res) => setMessages(res.messages));
  }, [activeId]);

  useEffect(() => {
    if (!accessToken) return;
    const socket = connectSocket(accessToken);
    socket.on("message:new", (payload: { conversationId: string; message: ChatMessage }) => {
      if (payload.conversationId === activeId) {
        setMessages((prev) => [...prev, payload.message]);
      }
    });
    return () => disconnectSocket();
  }, [accessToken, activeId]);

  const handleSend = useCallback(
    async (text: string, offerPrice?: number) => {
      if (!activeId) return;
      const { message } = await conversationsApi.sendMessage(activeId, text, offerPrice);
      setMessages((prev) => [...prev, message]);
    },
    [activeId],
  );

  return (
    <div>
      <h1>Messagerie</h1>
      <div>
        <ul>
          {conversations.map((c) => (
            <li key={c.id}>
              <button onClick={() => setActiveId(c.id)}>{c.product.title}</button>
            </li>
          ))}
        </ul>
        {activeId && user && (
          <>
            <ConversationThread messages={messages} currentUserId={user.id} />
            <MessageComposer onSend={handleSend} />
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Route + bouton "Contacter le vendeur" sur ProductCard**

Modifier `frontend/src/App.tsx` :

```typescript
import { Messagerie } from "./pages/Messagerie";
```

```tsx
          <Route
            path="/messagerie"
            element={
              <PrivateRoute>
                <Messagerie />
              </PrivateRoute>
            }
          />
```

Modifier `frontend/src/components/ProductCard.tsx` pour ajouter un point d'entrée vers la conversation :

```tsx
import { useNavigate } from "react-router-dom";
import type { Product } from "../api/products";
import { conversationsApi } from "../api/conversations";

export function ProductCard({ product }: { product: Product }) {
  const navigate = useNavigate();

  async function handleContact() {
    await conversationsApi.start(product.id);
    navigate("/messagerie");
  }

  return (
    <article>
      {product.photos[0] && <img src={product.photos[0]} alt={product.title} width={200} />}
      <h3>{product.title}</h3>
      <p>{product.price.toLocaleString("fr-FR")} FCFA</p>
      <button onClick={handleContact}>Contacter le vendeur</button>
    </article>
  );
}
```

- [ ] **Step 9: Build check**

```bash
cd frontend
npm run build
```

Expected: compiles without errors.

- [ ] **Step 10: Commit**

```bash
git add frontend/src/realtime frontend/src/api/conversations.ts frontend/src/components/MessageComposer.tsx frontend/src/components/ConversationThread.tsx frontend/src/pages/Messagerie.tsx frontend/src/components/ProductCard.tsx frontend/src/App.tsx frontend/src/context/AuthContext.tsx frontend/package.json frontend/package-lock.json
git commit -m "feat: add real-time messaging UI with Socket.IO"
```

---

## Self-Review Notes

- **Spec coverage :** ce plan couvre le chat intégré acheteur/vendeur avec offre de prix formelle (`offerPrice`), condition nécessaire pour la Phase 4 (acceptation d'une offre → création de commande). L'escrow lui-même reste hors scope ici.
- **Placeholder scan :** aucun TBD/TODO.
- **Type consistency :** `ChatMessage` (id, conversationId, senderId, text, offerPrice, createdAt) cohérent entre `message.repository.ts` (Task 1), les réponses controller (Task 3) et `frontend/src/api/conversations.ts` (Task 4). L'événement Socket.IO `message:new` porte `{ conversationId, message }` des deux côtés (émis dans `conversation.service.ts`, consommé dans `Messagerie.tsx`).
- **Ownership scoping :** `assertParticipant` dans `conversation.service.ts` vérifie `buyerId`/`vendorId` avant toute lecture/écriture — reconduit la convention établie en Phase 2 (`ProductService`).
