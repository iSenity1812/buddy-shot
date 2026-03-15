import "reflect-metadata";
import express, { Application } from "express";
import cors from "cors";
import { Container } from "inversify";
import { InversifyExpressServer } from "inversify-express-utils";
import { envConfig } from "./shared/config/env.config";
import { sharedModule } from "./shared/shared.module";
import { healthModule } from "./modules/health/health.module";
import { profileModule } from "./modules/user-profile/profile.module";
import { identityModule } from "./modules/identity-access/identity.module";
import { socialFriendModule } from "./modules/social-friend/social-friend.module";
import { photoSharingModule } from "./modules/photo-sharing/photo-sharing.module";
import {
  errorMiddleware,
  notFoundMiddleware,
} from "./shared/middleware/error.middleware";
import { globalConstants } from "./shared/constants";
import { jwtAuthMiddleware } from "./shared/security/jwt-auth.middleware";

export async function createApp(): Promise<Application> {
  const container = new Container({ defaultScope: "Singleton" });
  container.load(
    sharedModule,
    healthModule,
    profileModule,
    identityModule,
    socialFriendModule,
    photoSharingModule,
  );

  const server = new InversifyExpressServer(container, null, {
    rootPath: globalConstants.API_ROOT,
  });

  server.setConfig((app) => {
    app.use(express.json());
    app.use(jwtAuthMiddleware);
    app.use(
      cors({
        origin: envConfig.corsOrigin,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Auth-Resource"],
      }),
    );
  });

  server.setErrorConfig((app) => {
    app.use(notFoundMiddleware);
    app.use(errorMiddleware);
  });

  return server.build();
}
