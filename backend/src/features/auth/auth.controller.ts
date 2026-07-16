import type { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service.js";
import { registerSchema, loginSchema } from "./auth.schema.js";
import { ValidationError, UnauthorizedError } from "../../shared/errors/index.js";
import { UserRepository } from "../users/user.repository.js";

const userRepo = new UserRepository();

const REFRESH_COOKIE = "djassa_refresh";
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "none" as const,
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

function toPublicUser(user: { id: string; email: string; accountType: string }) {
  return { id: user.id, email: user.email, accountType: user.accountType };
}

function fieldErrors(error: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } }) {
  const flat = error.flatten().fieldErrors;
  const result: Record<string, string> = {};
  for (const [key, messages] of Object.entries(flat)) {
    if (messages?.[0]) result[key] = messages[0];
  }
  return result;
}

export async function register(req: Request, res: Response, next: NextFunction) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return next(new ValidationError(fieldErrors(parsed.error)));

  try {
    const { user, accessToken, refreshToken } = await AuthService.register(parsed.data);
    res.cookie(REFRESH_COOKIE, refreshToken, REFRESH_COOKIE_OPTIONS);
    res.status(201).json({ user: toPublicUser(user), accessToken });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return next(new ValidationError(fieldErrors(parsed.error)));

  try {
    const { user, accessToken, refreshToken } = await AuthService.login(parsed.data);
    res.cookie(REFRESH_COOKIE, refreshToken, REFRESH_COOKIE_OPTIONS);
    res.json({ user: toPublicUser(user), accessToken });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (!token) throw new UnauthorizedError("Aucune session à renouveler");
    const accessToken = await AuthService.refreshAccessToken(token);
    res.json({ accessToken });
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await userRepo.findById(req.userId!);
    if (!user) throw new UnauthorizedError();
    res.json({ user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
}
