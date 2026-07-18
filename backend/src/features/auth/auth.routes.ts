import { Router } from "express";
import rateLimit from "express-rate-limit";
import { register, login, refresh, me, logout, forgotPassword, resetPassword } from "./auth.controller.js";
import { requireAuth } from "./auth.middleware.js";

export const authRouter = Router();

const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/refresh", refresh);
authRouter.post("/logout", logout);
authRouter.get("/me", requireAuth, me);
authRouter.post("/forgot-password", resetLimiter, forgotPassword);
authRouter.post("/reset-password", resetLimiter, resetPassword);
