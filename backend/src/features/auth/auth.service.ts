import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserRepository } from "../users/user.repository.js";
import { config } from "../../shared/config/index.js";
import { ConflictError, UnauthorizedError } from "../../shared/errors/index.js";
import type { RegisterInput, LoginInput } from "./auth.schema.js";

const userRepo = new UserRepository();

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

  refreshAccessToken(refreshToken: string): string {
    try {
      const payload = jwt.verify(refreshToken, config.jwt.refreshSecret) as { userId: string };
      return jwt.sign({ userId: payload.userId }, config.jwt.accessSecret, {
        expiresIn: config.jwt.accessExpiresIn,
      } as jwt.SignOptions);
    } catch {
      throw new UnauthorizedError("Session expirée, reconnectez-vous");
    }
  },
};
