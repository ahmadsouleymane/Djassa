import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  phone: z
    .string()
    .regex(/^0\d{9}$/, "Le numéro doit commencer par 0 et contenir exactement 10 chiffres"),
  password: z.string().min(1, "Le mot de passe est requis"),
  accountType: z.enum(["vendeur", "client"]).default("vendeur"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
