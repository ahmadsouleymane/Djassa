import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { pinoHttp } from "pino-http";
import { config } from "./shared/config/index.js";
import { logger } from "./shared/logger/index.js";
import { requestId } from "./shared/middleware/requestId.js";
import { errorHandler } from "./shared/middleware/errorHandler.js";
import { authRouter } from "./features/auth/auth.routes.js";
import { uploadRouter } from "./features/uploads/upload.routes.js";
import { productRouter } from "./features/products/product.routes.js";
import { publicProductRouter } from "./features/products/public.routes.js";
import { conversationRouter } from "./features/conversations/conversation.routes.js";
import { orderRouter } from "./features/orders/order.routes.js";
import { webhookRouter, billingRouter } from "./features/billing/billing.routes.js";
import { verificationRouter } from "./features/verification/verification.routes.js";

export const app = express();

app.use(requestId);
app.use(pinoHttp({ logger }));
app.use(helmet());
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 600,
  }),
);
app.use(cookieParser());
app.use("/api/billing/webhook", express.raw({ type: "application/json" }), webhookRouter);
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRouter);
app.use("/api/uploads", uploadRouter);
app.use("/api/products", productRouter);
app.use("/api/public/products", publicProductRouter);
app.use("/api/conversations", conversationRouter);
app.use("/api/orders", orderRouter);
app.use("/api/billing", billingRouter);
app.use("/api/verification", verificationRouter);

app.use(errorHandler);
