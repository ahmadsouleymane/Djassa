import type { Request, Response, NextFunction } from "express";
import { WaitlistService } from "./waitlist.service.js";
import { createWaitlistSignupSchema } from "./waitlist.schema.js";
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
  const parsed = createWaitlistSignupSchema.safeParse(req.body);
  if (!parsed.success) return next(new ValidationError(fieldErrors(parsed.error)));

  try {
    const signup = await WaitlistService.create(parsed.data);
    res.status(201).json({ signup: { id: signup.id, email: signup.email } });
  } catch (err) {
    next(err);
  }
}

export async function count(_req: Request, res: Response, next: NextFunction) {
  try {
    const total = await WaitlistService.count();
    res.json({ count: total });
  } catch (err) {
    next(err);
  }
}
