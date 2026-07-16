import type { Request, Response, NextFunction } from "express";
import { ReviewService } from "./review.service.js";
import { createReviewSchema } from "./review.schema.js";
import { ValidationError } from "../../shared/errors/index.js";

function fieldErrors(error: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } }) {
  const flat = error.flatten().fieldErrors;
  const result: Record<string, string> = {};
  for (const [key, messages] of Object.entries(flat)) {
    if (messages?.[0]) result[key] = messages[0];
  }
  return result;
}

export async function create(req: Request, res: Response, next: NextFunction) {
  const parsed = createReviewSchema.safeParse(req.body);
  if (!parsed.success) return next(new ValidationError(fieldErrors(parsed.error)));

  try {
    const review = await ReviewService.create(req.userId!, parsed.data);
    res.status(201).json({ review });
  } catch (err) {
    next(err);
  }
}

export async function listForVendor(req: Request, res: Response, next: NextFunction) {
  try {
    const reviews = await ReviewService.listByVendor(req.params.vendorId as string);
    res.json({ reviews });
  } catch (err) {
    next(err);
  }
}
