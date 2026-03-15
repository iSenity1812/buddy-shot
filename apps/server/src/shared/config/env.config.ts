import "dotenv/config";
export const envConfig = {
  port: Number(process.env.PORT) || 4000,
  host: process.env.HOST || "0.0.0.0",
  nodeEnv: process.env.NODE_ENV || "development",
  logLevel: process.env.LOG_LEVEL || "info",
  jwtSecret: process.env.JWT_SECRET || "access-secret",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "refresh-secret",
  jwtResetSecret: process.env.JWT_RESET_SECRET || "reset-secret",
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  jwtResetExpiresIn: process.env.JWT_RESET_EXPIRES_IN || "15m",
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
