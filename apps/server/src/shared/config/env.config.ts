import { existsSync } from "node:fs";
import { resolve } from "node:path";
import dotenv from "dotenv";

const envFileCandidates = [
  resolve(process.cwd(), ".env"),
  resolve(process.cwd(), "apps/server/.env"),
  resolve(__dirname, "../../../.env"),
];

const envFilePath = envFileCandidates.find((candidate) =>
  existsSync(candidate),
);

dotenv.config(envFilePath ? { path: envFilePath } : undefined);

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

export const envConfig = {
  port: Number(process.env.PORT) || 4000,
  host: process.env.HOST || "0.0.0.0",
  nodeEnv: process.env.NODE_ENV || "development",
  logLevel: process.env.LOG_LEVEL || "info",
  jwtSecret: process.env.JWT_SECRET || "access-secret",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "refresh-secret",
  jwtResetSecret: process.env.JWT_RESET_SECRET || "reset-secret",
  jwtAccessExpiresIn: requireEnv("JWT_ACCESS_EXPIRES_IN"),
  jwtRefreshExpiresIn: requireEnv("JWT_REFRESH_EXPIRES_IN"),
  jwtResetExpiresIn: requireEnv("JWT_RESET_EXPIRES_IN"),
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",

  db: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    database: process.env.DB_NAME || "myapp",
    pool: {
      max: Number(process.env.DB_POOL_MAX) || 10,
      idleTimeoutMillis: Number(process.env.DB_POOL_IDLE_TIMEOUT) || 30000,
      connectionTimeoutMillis:
        Number(process.env.DB_POOL_CONNECTION_TIMEOUT) || 5000,
    },
  },
  cloudflare: {
    r2AccountId: process.env.R2_ACCOUNT_ID || "",
    r2BucketName: process.env.R2_BUCKET_NAME || "",
    r2PublicUrlBase: process.env.R2_PUBLIC_URL_BASE || "", // e.g. https://<account_id>.r2.cloudflarestorage.com/<bucket_name>/
    r2AccessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
};
