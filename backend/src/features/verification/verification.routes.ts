import { Router } from "express";
import { requireAuth, requireVendor, requireAdmin } from "../auth/auth.middleware.js";
import { submit, status, listPending, approve, reject } from "./verification.controller.js";

export const verificationRouter = Router();

verificationRouter.use(requireAuth);
verificationRouter.post("/submit", requireVendor, submit);
verificationRouter.get("/status", requireVendor, status);
verificationRouter.get("/admin/pending", requireAdmin, listPending);
verificationRouter.post("/admin/:userId/approve", requireAdmin, approve);
verificationRouter.post("/admin/:userId/reject", requireAdmin, reject);
