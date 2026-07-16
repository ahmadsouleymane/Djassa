import type { Request, Response, NextFunction } from "express";
import { VerificationService } from "./verification.service.js";
import { submitVerificationSchema, rejectVerificationSchema } from "./verification.schema.js";
import { ValidationError } from "../../shared/errors/index.js";

function fieldErrors(error: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } }) {
  const flat = error.flatten().fieldErrors;
  const result: Record<string, string> = {};
  for (const [key, messages] of Object.entries(flat)) {
    if (messages?.[0]) result[key] = messages[0];
  }
  return result;
}

export async function submit(req: Request, res: Response, next: NextFunction) {
  const parsed = submitVerificationSchema.safeParse(req.body);
  if (!parsed.success) return next(new ValidationError(fieldErrors(parsed.error)));

  try {
    await VerificationService.submit(req.userId!, parsed.data.documentUrl);
    res.status(200).json({ status: "en_attente" });
  } catch (err) {
    next(err);
  }
}

export async function status(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await VerificationService.status(req.userId!));
  } catch (err) {
    next(err);
  }
}

export async function listPending(_req: Request, res: Response, next: NextFunction) {
  try {
    const users = await VerificationService.listPending();
    res.json({
      users: users.map((u) => ({ id: u.id, email: u.email, documentUrl: u.sellerVerificationDocUrl })),
    });
  } catch (err) {
    next(err);
  }
}

export async function approve(req: Request, res: Response, next: NextFunction) {
  try {
    await VerificationService.approve(req.params.userId as string);
    res.json({ status: "approuvee" });
  } catch (err) {
    next(err);
  }
}

export async function reject(req: Request, res: Response, next: NextFunction) {
  const parsed = rejectVerificationSchema.safeParse(req.body);
  if (!parsed.success) return next(new ValidationError(fieldErrors(parsed.error)));

  try {
    await VerificationService.reject(req.params.userId as string, parsed.data.reason);
    res.json({ status: "rejetee" });
  } catch (err) {
    next(err);
  }
}
