import { Router } from "express";
import { requireAuth, requireAdmin } from "../auth/auth.middleware.js";
import { create, listMine, checkout, ship, confirm, dispute, resolveDispute } from "./order.controller.js";

export const orderRouter = Router();

orderRouter.use(requireAuth);
orderRouter.post("/", create);
orderRouter.get("/mine", listMine);
orderRouter.post("/:id/checkout", checkout);
orderRouter.post("/:id/ship", ship);
orderRouter.post("/:id/confirm", confirm);
orderRouter.post("/:id/dispute", dispute);
orderRouter.post("/:id/dispute/resolve", requireAdmin, resolveDispute);
