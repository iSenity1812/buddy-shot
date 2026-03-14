import express, { Application } from "express";
import cors from "cors";
import { envConfig } from "./config/env.config";

export async function createApp(): Promise<Application> {
  const app = express();
  app.use(
    cors({
      origin: envConfig.corsOrigin,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Auth-Resource"],
    }),
  );
  return app;
}
