import { Router } from "express";
import { requireAuth, requireVendor } from "../auth/auth.middleware.js";
import { requireAdmin } from "../admin/admin.middleware.js";
import { submit, status, listPending, approve, reject } from "./verification.controller.js";

const router = Router();
router.post("/submit", requireAuth, requireVendor, submit);
router.get("/status", requireAuth, requireVendor, status);
router.get("/admin/pending", requireAdmin, listPending);
router.post("/admin/:userId/approve", requireAdmin, approve);
router.post("/admin/:userId/reject", requireAdmin, reject);

export { router as verificationRouter };
