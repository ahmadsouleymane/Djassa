function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

const port = parseInt(process.env.PORT ?? "4000", 10);

export const config = {
  port,
  nodeEnv: process.env.NODE_ENV ?? "development",
  apiBaseUrl: process.env.API_BASE_URL ?? `http://localhost:${port}`,
  corsOrigin: requiredEnv("CORS_ORIGIN"),
  database: {
    url: requiredEnv("DATABASE_URL"),
  },
  jwt: {
    accessSecret: requiredEnv("JWT_ACCESS_SECRET"),
    refreshSecret: requiredEnv("JWT_REFRESH_SECRET"),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "30m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "30d",
  },
  cloudinary: {
    cloudName: requiredEnv("CLOUDINARY_CLOUD_NAME"),
    apiKey: requiredEnv("CLOUDINARY_API_KEY"),
    apiSecret: requiredEnv("CLOUDINARY_API_SECRET"),
  },
  geniusPay: {
    webhookSecret: requiredEnv("GENIUSPAY_WEBHOOK_SECRET"),
    apiKey: requiredEnv("GENIUSPAY_API_KEY"),
    apiSecret: requiredEnv("GENIUSPAY_API_SECRET"),
    baseUrl: requiredEnv("GENIUSPAY_BASE_URL"),
  },
  adminEmails: (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
  resend: {
    // Optionnel : l'envoi d'email (reset de mot de passe, emails admin) est
    // désactivé tant que RESEND_API_KEY n'est pas fourni, plutôt que de faire
    // échouer le démarrage du serveur.
    apiKey: process.env.RESEND_API_KEY ?? "",
    fromEmail: process.env.RESEND_FROM_EMAIL ?? "Djassa <no-reply@djassa.net>",
  },
  frontendUrl: process.env.FRONTEND_URL ?? process.env.CORS_ORIGIN ?? "http://localhost:5173",
} as const;
