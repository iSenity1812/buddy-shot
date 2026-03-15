import { ContainerModule } from "inversify";
import { PrismaClient } from "@prisma/client";
import { PROFILE_KEY } from "./di/profile.token";
import { PRISMA_CLIENT, EVENT_BUS } from "@/shared/shared-di.tokens";
import type { IEventBus } from "@/shared/application";
import type { IProfileRepository } from "./domain/repositories/profile.repository.interface";
import type { IStoragePort } from "./application/ports/storage.port";
import type { IQrCodePort } from "./application/ports/qrcode.port";
import { PrismaProfileRepository } from "./infrastructure/repositories/prisma-profile.repository";
import { R2StorageAdapter } from "./infrastructure/persistence/r2-storage.adapter";
import { QrCodeAdapter } from "./infrastructure/persistence/qrcode.adapter";
import { GetProfileUseCase } from "./application/use-cases/get-profile.usecase";
import { UpdateProfileUseCase } from "./application/use-cases/update-profile.usecase";
import { ChangeAvatarUseCase } from "./application/use-cases/change-avatar.usecase";
import { GenerateProfileQrCodeUseCase } from "./application/use-cases/generate-profile-qrcode.usecase";
import { GenerateAvatarUploadUrlUseCase } from "./application/use-cases/generate-avatar-upload-url.usecase";
import "./presentation/profile.controller";

export const profileModule = new ContainerModule((bind) => {
  bind<IStoragePort>(PROFILE_KEY.PORT.STORAGE)
    .to(R2StorageAdapter)
    .inSingletonScope();

  bind<IQrCodePort>(PROFILE_KEY.PORT.QR_CODE)
    .to(QrCodeAdapter)
    .inSingletonScope();

  bind<IProfileRepository>(PROFILE_KEY.REPOSITORY)
    .toDynamicValue(
      ({ container }) =>
        new PrismaProfileRepository(
          container.get<PrismaClient>(PRISMA_CLIENT),
          container.get<IEventBus>(EVENT_BUS),
        ),
    )
    .inTransientScope();

  bind<GetProfileUseCase>(PROFILE_KEY.USE_CASE.GET_PROFILE)
    .to(GetProfileUseCase)
    .inTransientScope();

  bind<UpdateProfileUseCase>(PROFILE_KEY.USE_CASE.UPDATE_PROFILE)
    .to(UpdateProfileUseCase)
    .inTransientScope();

  bind<ChangeAvatarUseCase>(PROFILE_KEY.USE_CASE.CHANGE_AVATAR)
    .to(ChangeAvatarUseCase)
    .inTransientScope();

  bind<GenerateProfileQrCodeUseCase>(PROFILE_KEY.USE_CASE.GENERATE_QR_CODE)
    .to(GenerateProfileQrCodeUseCase)
    .inTransientScope();

  bind<GenerateAvatarUploadUrlUseCase>(
    PROFILE_KEY.USE_CASE.GENERATE_AVATAR_UPLOAD_URL,
  )
    .to(GenerateAvatarUploadUrlUseCase)
    .inTransientScope();
});
