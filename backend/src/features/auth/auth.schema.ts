import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  phone: z
    .string()
    .regex(/^0\d{9}$/, "Le numéro doit commencer par 0 et contenir exactement 10 chiffres"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  accountType: z.enum(["vendeur", "client"]).default("vendeur"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(10),
    password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
