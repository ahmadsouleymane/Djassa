import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
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
import { sitemapRouter } from "./features/products/sitemap.routes.js";
import { conversationRouter } from "./features/conversations/conversation.routes.js";
import { orderRouter } from "./features/orders/order.routes.js";
import { webhookRouter, billingRouter } from "./features/billing/billing.routes.js";
import { verificationRouter } from "./features/verification/verification.routes.js";
import { reviewRouter, publicReviewRouter, publicTrustScoreRouter } from "./features/reviews/review.routes.js";
import { publicVendorRouter } from "./features/users/public.routes.js";
import { boutiqueRouter } from "./features/users/boutique.routes.js";
import { analyticsRouter } from "./features/analytics/analytics.routes.js";
import { reportRouter } from "./features/reports/report.routes.js";
import { adminRouter } from "./features/admin/admin.routes.js";
import { waitlistRouter } from "./features/waitlist/waitlist.routes.js";
import { referralRouter } from "./features/referrals/referrals.routes.js";

export const app = express();

// Render/Vercel siègent derrière un proxy : nécessaire pour que req.ip reflète
// l'IP réelle du visiteur (géolocalisation analytics, rate limiting).
app.set("trust proxy", 1);

app.use(requestId);
app.use(pinoHttp({ logger }));
app.use(helmet());
app.use(compression());
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
app.use(sitemapRouter);

app.use("/api/auth", authRouter);
app.use("/api/uploads", uploadRouter);
app.use("/api/products", productRouter);
app.use("/api/public/products", publicProductRouter);
app.use("/api/conversations", conversationRouter);
app.use("/api/orders", orderRouter);
app.use("/api/billing", billingRouter);
app.use("/api/verification", verificationRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/public/vendors/:vendorId/reviews", publicReviewRouter);
app.use("/api/public/vendors/:vendorId/trust-score", publicTrustScoreRouter);
app.use("/api/public/vendors/:vendorId", publicVendorRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/reports", reportRouter);
app.use("/api/admin", adminRouter);
app.use("/api/waitlist", waitlistRouter);
app.use("/api/boutique", boutiqueRouter);
app.use("/api/referrals", referralRouter);

app.use(errorHandler);
