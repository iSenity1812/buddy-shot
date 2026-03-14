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
};
