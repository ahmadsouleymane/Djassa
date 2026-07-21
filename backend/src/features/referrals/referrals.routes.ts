import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireAuth } from "../auth/auth.middleware.js";
import { getCode, getStats, applyCode, checkCode, getLeaderboard } from "./referrals.controller.js";

export const referralRouter = Router();

const applyLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

// Routes authentifiées
referralRouter.get("/code", requireAuth, getCode);
referralRouter.get("/mine", requireAuth, getStats);

// Routes publiques
referralRouter.post("/apply", applyLimiter, applyCode);
referralRouter.get("/check/:code", checkCode);
referralRouter.get("/leaderboard", getLeaderboard);
