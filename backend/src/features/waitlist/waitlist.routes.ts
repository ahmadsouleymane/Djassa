import { Router } from "express";
import rateLimit from "express-rate-limit";
import { create, count } from "./waitlist.controller.js";

const signupLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

export const waitlistRouter = Router();

waitlistRouter.post("/", signupLimiter, create);
waitlistRouter.get("/count", count);
