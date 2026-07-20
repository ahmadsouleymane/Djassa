import { Router } from "express";
import { requireAuth, requireVendor, requireVerified } from "../auth/auth.middleware.js";
import { sign } from "./upload.controller.js";

export const uploadRouter = Router();

uploadRouter.post("/sign", requireAuth, requireVendor, requireVerified, sign);
