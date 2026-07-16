import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { create, listForVendor } from "./review.controller.js";

export const reviewRouter = Router();
reviewRouter.post("/", requireAuth, create);

export const publicReviewRouter = Router();
publicReviewRouter.get("/", listForVendor);
