import { ContainerModule } from "inversify";
import { PrismaClient } from "@prisma/client";
import { IDENTITY_KEY } from "./di/identity.token";
import { PRISMA_CLIENT, EVENT_BUS } from "@/shared/shared-di.tokens";
import type { IEventBus } from "@/shared/application";
import type {
  IRefreshTokenRepository,
  IUserRepository,
} from "./domain/repositories/auth.repository.interface";
import type {
  IDeviceService,
  IPasswordHasher,
  ITokenService,
} from "./domain/services/auth.service.interface";
import { PrismaUserRepository } from "./infrastructure/repositories/prisma-user.repository";
import { PrismaRefreshTokenRepository } from "./infrastructure/repositories/prisma-rt.repository";
import { BcryptPasswordHasher } from "./infrastructure/services/bcrypt.password-hasher";
import { PrismaDeviceService } from "./infrastructure/services/prisma-device";
import { JwtTokenService } from "./infrastructure/services/jwt-token";
import { RegisterUseCase } from "./application/uses-cases/register.usecase";
import { LoginUseCase } from "./application/uses-cases/login.usecase";
import { RefreshTokenUseCase } from "./application/uses-cases/refresh.usecase";
import { LogoutUseCase } from "./application/uses-cases/logout.usecase";
import { GetMeUseCase } from "./application/uses-cases/get-me.usecase";
import { UpdateEmailUseCase } from "./application/uses-cases/update-email.usecase";
import { ChangePasswordUseCase } from "./application/uses-cases/change-password.usecase";
import "./presentation/auth.controller";

export const identityModule = new ContainerModule((bind) => {
  bind<IUserRepository>(IDENTITY_KEY.REPOSITORY.USER)
    .toDynamicValue(
      ({ container }) =>
        new PrismaUserRepository(
          container.get<PrismaClient>(PRISMA_CLIENT),
          container.get<IEventBus>(EVENT_BUS),
        ),
    )
    .inTransientScope();

  bind<IRefreshTokenRepository>(IDENTITY_KEY.REPOSITORY.REFRESH_TOKEN)
    .toDynamicValue(
      ({ container }) =>
        new PrismaRefreshTokenRepository(
          container.get<PrismaClient>(PRISMA_CLIENT),
        ),
    )
    .inTransientScope();

  bind<IPasswordHasher>(IDENTITY_KEY.DOMAIN_SERVICE.PASSWORD_HASHER)
    .to(BcryptPasswordHasher)
    .inSingletonScope();

  bind<IDeviceService>(IDENTITY_KEY.DOMAIN_SERVICE.DEVICE)
    .toDynamicValue(
      ({ container }) =>
        new PrismaDeviceService(container.get<PrismaClient>(PRISMA_CLIENT)),
    )
    .inSingletonScope();

  bind<ITokenService>(IDENTITY_KEY.DOMAIN_SERVICE.TOKEN)
    .to(JwtTokenService)
    .inSingletonScope();

  bind<RegisterUseCase>(IDENTITY_KEY.USE_CASE.REGISTER)
    .to(RegisterUseCase)
    .inTransientScope();

  bind<LoginUseCase>(IDENTITY_KEY.USE_CASE.LOGIN)
    .to(LoginUseCase)
    .inTransientScope();

  bind<RefreshTokenUseCase>(IDENTITY_KEY.USE_CASE.REFRESH)
    .to(RefreshTokenUseCase)
    .inTransientScope();

  bind<LogoutUseCase>(IDENTITY_KEY.USE_CASE.LOGOUT)
    .to(LogoutUseCase)
    .inTransientScope();

  bind<GetMeUseCase>(IDENTITY_KEY.USE_CASE.GET_ME)
    .to(GetMeUseCase)
    .inTransientScope();

  bind<UpdateEmailUseCase>(IDENTITY_KEY.USE_CASE.UPDATE_EMAIL)
    .to(UpdateEmailUseCase)
    .inTransientScope();

  bind<ChangePasswordUseCase>(IDENTITY_KEY.USE_CASE.CHANGE_PASSWORD)
    .to(ChangePasswordUseCase)
    .inTransientScope();
});
