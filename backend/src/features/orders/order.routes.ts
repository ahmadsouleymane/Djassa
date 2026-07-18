import { Router } from "express";
import { requireAuth, requireAdmin, requireVendor } from "../auth/auth.middleware.js";
import { create, createDirect, checkoutSummary, payDirect, listMine, checkout, ship, confirm, dispute, resolveDispute, vendorStats } from "./order.controller.js";

export const orderRouter = Router();

orderRouter.use(requireAuth);
orderRouter.post("/", create);
orderRouter.post("/direct", createDirect);
orderRouter.get("/checkout/:reference", checkoutSummary);
orderRouter.post("/pay", payDirect);
orderRouter.get("/mine", listMine);
orderRouter.get("/stats/vendor", requireVendor, vendorStats);
orderRouter.post("/:id/checkout", checkout);
orderRouter.post("/:id/ship", ship);
orderRouter.post("/:id/confirm", confirm);
orderRouter.post("/:id/dispute", dispute);
orderRouter.post("/:id/dispute/resolve", requireAdmin, resolveDispute);
