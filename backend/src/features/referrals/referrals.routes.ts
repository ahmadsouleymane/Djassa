import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireAuth, requireAdmin } from "../auth/auth.middleware.js";
import {
  getCode,
  getStats,
  applyCode,
  checkCode,
  getLeaderboard,
  getWallet,
  createWithdrawal,
  listWithdrawals,
  adminSetWithdrawalStatus,
} from "./referrals.controller.js";

export const referralRouter = Router();

const applyLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

const withdrawLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

// Routes authentifiées
referralRouter.get("/code", requireAuth, getCode);
referralRouter.get("/mine", requireAuth, getStats);

// Cagnotte & retraits (authentifiés)
referralRouter.get("/wallet", requireAuth, getWallet);
referralRouter.get("/withdrawals", requireAuth, listWithdrawals);
referralRouter.post("/withdrawals", requireAuth, withdrawLimiter, createWithdrawal);

// Admin : traiter un retrait
referralRouter.patch("/withdrawals/:id", requireAuth, requireAdmin, adminSetWithdrawalStatus);

// Routes publiques
referralRouter.post("/apply", applyLimiter, applyCode);
referralRouter.get("/check/:code", checkCode);
referralRouter.get("/leaderboard", getLeaderboard);
