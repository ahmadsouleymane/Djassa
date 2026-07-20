import { Router } from "express";
import { requireAuth, requireVendor } from "../auth/auth.middleware.js";
import { webhook, subscribe, me, syncPlan } from "./billing.controller.js";

export const webhookRouter = Router();
webhookRouter.post("/geniuspay", webhook);

export const billingRouter = Router();
billingRouter.post("/subscribe", requireAuth, requireVendor, subscribe);
billingRouter.post("/sync", requireAuth, requireVendor, syncPlan);
billingRouter.get("/me", requireAuth, requireVendor, me);
