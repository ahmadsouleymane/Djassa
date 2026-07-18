import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomBytes, createHash } from "node:crypto";
import { UserRepository } from "../users/user.repository.js";
import { PasswordResetRepository } from "./passwordReset.repository.js";
import { config } from "../../shared/config/index.js";
import { ConflictError, UnauthorizedError, ValidationError } from "../../shared/errors/index.js";
import { sendEmail, passwordResetEmailHtml } from "../../shared/email/index.js";
import type { RegisterInput, LoginInput } from "./auth.schema.js";

const userRepo = new UserRepository();
const passwordResetRepo = new PasswordResetRepository();

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function signTokens(userId: string, accountType: string) {
  const accessToken = jwt.sign({ userId, accountType }, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
  } as jwt.SignOptions);
  const refreshToken = jwt.sign({ userId }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  } as jwt.SignOptions);
  return { accessToken, refreshToken };
}

export const AuthService = {
  async register(input: RegisterInput) {
    const existing = await userRepo.findByEmail(input.email);
    if (existing) throw new ConflictError("Un compte existe déjà avec cet email");

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await userRepo.create({
      email: input.email,
      phone: input.phone,
      passwordHash,
      accountType: input.accountType,
    });

    return { user, ...signTokens(user.id, user.accountType) };
  },

  async login(input: LoginInput) {
    const user = await userRepo.findByEmail(input.email);
    if (!user) throw new UnauthorizedError("Email ou mot de passe incorrect");

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) throw new UnauthorizedError("Email ou mot de passe incorrect");

    return { user, ...signTokens(user.id, user.accountType) };
  },

  async refreshAccessToken(refreshToken: string): Promise<string> {
    let userId: string;
    try {
      ({ userId } = jwt.verify(refreshToken, config.jwt.refreshSecret) as { userId: string });
    } catch {
      throw new UnauthorizedError("Session expirée, reconnectez-vous");
    }

    const user = await userRepo.findById(userId);
    if (!user) throw new UnauthorizedError("Session expirée, reconnectez-vous");

    return jwt.sign({ userId: user.id, accountType: user.accountType }, config.jwt.accessSecret, {
      expiresIn: config.jwt.accessExpiresIn,
    } as jwt.SignOptions);
  },

  async forgotPassword(email: string): Promise<string | undefined> {
    const user = await userRepo.findByEmail(email);
    // Toujours un succès générique côté API : on ne révèle jamais si l'email existe.
    if (!user) return undefined;

    const token = randomBytes(32).toString("hex");
    const tokenHash = hashResetToken(token);
    await passwordResetRepo.create(user.id, tokenHash, new Date(Date.now() + RESET_TOKEN_TTL_MS));

    const resetUrl = `${config.frontendUrl}/reinitialiser-mot-de-passe/${token}`;
    await sendEmail(user.email, "Réinitialise ton mot de passe Djassa", passwordResetEmailHtml(resetUrl));
    // Le token en clair n'est jamais renvoyé par la route HTTP (le contrôleur
    // l'ignore) ; il n'est exposé ici que pour permettre aux tests d'exercer
    // le flux complet sans dépendre d'une vraie boîte mail.
    return token;
  },

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = hashResetToken(token);
    const record = await passwordResetRepo.findValidByHash(tokenHash);
    if (!record) throw new ValidationError({ token: "Lien de réinitialisation invalide ou expiré" });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await userRepo.update(record.userId, { passwordHash });
    await passwordResetRepo.markUsed(record.id);
    await passwordResetRepo.invalidateAllForUser(record.userId);
  },
};
