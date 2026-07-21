import type { Request, Response, NextFunction } from "express";
import { ReferralService } from "./referrals.service.js";
import { applyReferralSchema } from "./referrals.schema.js";
import { ValidationError } from "../../shared/errors/index.js";

function fieldErrors(error: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } }) {
  const flat = error.flatten().fieldErrors;
  const result: Record<string, string> = {};
  for (const [key, messages] of Object.entries(flat)) {
    if (messages?.[0]) result[key] = messages[0];
  }
  return result;
}

export async function getCode(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await ReferralService.getOrCreateCode(req.userId!);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getStats(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await ReferralService.getMyStats(req.userId!);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function applyCode(req: Request, res: Response, next: NextFunction) {
  const parsed = applyReferralSchema.safeParse(req.body);
  if (!parsed.success) return next(new ValidationError(fieldErrors(parsed.error)));

  try {
    const result = await ReferralService.applyCode(parsed.data);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function checkCode(req: Request, res: Response, next: NextFunction) {
  const code = req.params.code as string;
  if (!code?.trim()) return next(new ValidationError({ code: "Code requis" }));

  try {
    const result = await ReferralService.checkCode(code);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getLeaderboard(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await ReferralService.getLeaderboard();
    res.json(result);
  } catch (err) {
    next(err);
  }
}
