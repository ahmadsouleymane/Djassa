import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../../shared/config/index.js";
import { UnauthorizedError } from "../../shared/errors/index.js";
import { UserRepository } from "../users/user.repository.js";

const userRepo = new UserRepository();

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      accountType?: string;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return next(new UnauthorizedError());

  try {
    const payload = jwt.verify(header.slice(7), config.jwt.accessSecret) as {
      userId: string;
      accountType: string;
    };
    req.userId = payload.userId;
    req.accountType = payload.accountType;
    next();
  } catch {
    next(new UnauthorizedError("Session invalide"));
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return next();

  try {
    const payload = jwt.verify(header.slice(7), config.jwt.accessSecret) as {
      userId: string;
      accountType: string;
    };
    req.userId = payload.userId;
    req.accountType = payload.accountType;
  } catch {
    // Jeton absent/invalide : on continue en visiteur anonyme.
  }
  next();
}

export function requireVendor(req: Request, _res: Response, next: NextFunction) {
  if (req.accountType !== "vendeur") return next(new UnauthorizedError("Réservé aux comptes vendeur"));
  next();
}

export async function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  try {
    const user = await userRepo.findById(req.userId!);
    if (!user || !config.adminEmails.includes(user.email.toLowerCase())) {
      return next(new UnauthorizedError("Réservé aux administrateurs"));
    }
    next();
  } catch (err) {
    next(err);
  }
}

/** Bloque les vendeurs dont l'identité n'a pas encore été vérifiée. */
export async function requireVerified(req: Request, _res: Response, next: NextFunction) {
  if (req.accountType !== "vendeur") return next();
  try {
    const user = await userRepo.findById(req.userId!);
    if (!user) return next(new UnauthorizedError());
    if (user.sellerVerificationStatus !== "approuvee") {
      return next(new UnauthorizedError("Ton identité doit être vérifiée avant de pouvoir publier des annonces."));
    }
    next();
  } catch (err) {
    next(err);
  }
}
