function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const config = {
  port: parseInt(process.env.PORT ?? "4000", 10),
  nodeEnv: process.env.NODE_ENV ?? "development",
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
} as const;
