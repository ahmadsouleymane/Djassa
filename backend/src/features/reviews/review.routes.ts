import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { computeTrustScore } from "../../services/trustScore.js";
import { create, listForVendor } from "./review.controller.js";

export const reviewRouter = Router();
reviewRouter.post("/", requireAuth, create);

export const publicReviewRouter = Router();
publicReviewRouter.get("/", listForVendor);

export const publicTrustScoreRouter = Router({ mergeParams: true });
publicTrustScoreRouter.get("/", async (req, res, next) => {
  try {
    res.json(await computeTrustScore((req.params as Record<string, string>).vendorId));
  } catch (err) {
    next(err);
  }
});
