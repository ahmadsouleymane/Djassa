import type { Request, Response, NextFunction } from "express";
import { ReferralService } from "./referrals.service.js";
import { applyReferralSchema, createWithdrawalSchema } from "./referrals.schema.js";
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

export async function getWallet(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await ReferralService.getWallet(req.userId!);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function createWithdrawal(req: Request, res: Response, next: NextFunction) {
  const parsed = createWithdrawalSchema.safeParse(req.body);
  if (!parsed.success) return next(new ValidationError(fieldErrors(parsed.error)));

  try {
    const result = await ReferralService.requestWithdrawal(req.userId!, parsed.data);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function listWithdrawals(req: Request, res: Response, next: NextFunction) {
  try {
    const withdrawals = await ReferralService.listWithdrawals(req.userId!);
    res.json({ withdrawals });
  } catch (err) {
    next(err);
  }
}

export async function adminSetWithdrawalStatus(req: Request, res: Response, next: NextFunction) {
  const id = req.params.id as string;
  const status = (req.body as { status?: unknown }).status;
  if (status !== "paid" && status !== "rejected") {
    return next(new ValidationError({ status: "Statut invalide (paid ou rejected)" }));
  }

  try {
    const result = await ReferralService.adminSetWithdrawalStatus(id, status);
    if (!result) return next(new ValidationError({ id: "Retrait introuvable ou déjà traité" }));
    res.json(result);
  } catch (err) {
    next(err);
  }
}
