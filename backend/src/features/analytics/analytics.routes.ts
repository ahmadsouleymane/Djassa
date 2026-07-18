import { Router } from "express";
import rateLimit from "express-rate-limit";
import { optionalAuth } from "../auth/auth.middleware.js";
import { ingest } from "./analytics.controller.js";

const ingestLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

export const analyticsRouter = Router();

analyticsRouter.post("/ingest", ingestLimiter, optionalAuth, ingest);
