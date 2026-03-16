import { ContainerModule } from "inversify";
import type { PrismaClient } from "@prisma/client";
import { EVENT_BUS, PRISMA_CLIENT } from "@/shared/shared-di.tokens";
import type { IEventBus } from "@/shared/application";
import { PHOTO_SHARING_KEY } from "./di/photo-sharing.token";
import type { IPhotoSharingRepository } from "./domain/repositories/photo-sharing.repository.interface";
import type { IMediaStoragePort } from "./application/ports/media-storage.port";
import type { IPhotoRealtimePort } from "./application/ports/photo-realtime.port";
import type { IPhotoDomainEventDispatcherPort } from "./application/ports/photo-domain-event-dispatcher.port";
import { PrismaPhotoSharingRepository } from "./infrastructure/repositories/prisma-photo-sharing.repository";
import { PassthroughMediaStorageAdapter } from "./infrastructure/storage/passthrough-media-storage.adapter";
import { SocketPhotoRealtimeAdapter } from "./infrastructure/realtime/socket-photo-realtime.adapter";
import { PhotoEventDispatcher } from "./infrastructure/events/photo-event-dispatcher";
import { SendPhotoUseCase } from "./application/use-cases/send-photo.usecase";
import { GetPhotoFeedUseCase } from "./application/use-cases/get-photo-feed.usecase";
import { GetAllPhotosUseCase } from "./application/use-cases/get-all-photos.usecase";
import { GetMyPhotosUseCase } from "./application/use-cases/get-my-photos.usecase";
import { UpdateMyPhotoCaptionUseCase } from "./application/use-cases/update-my-photo-caption.usecase";
import { DeleteMyPhotoUseCase } from "./application/use-cases/delete-my-photo.usecase";
import { ReactToPhotoUseCase } from "./application/use-cases/react-to-photo.usecase";
import { RemoveReactionUseCase } from "./application/use-cases/remove-reaction.usecase";
import "./presentation/photo-sharing.controller";

export const photoSharingModule = new ContainerModule((bind) => {
  bind<IMediaStoragePort>(PHOTO_SHARING_KEY.PORT.MEDIA_STORAGE)
    .to(PassthroughMediaStorageAdapter)
    .inSingletonScope();

  bind<IPhotoRealtimePort>(PHOTO_SHARING_KEY.PORT.REALTIME)
    .to(SocketPhotoRealtimeAdapter)
    .inSingletonScope();

  bind<IPhotoDomainEventDispatcherPort>(PHOTO_SHARING_KEY.PORT.EVENT_DISPATCHER)
    .to(PhotoEventDispatcher)
    .inSingletonScope();

  bind<IPhotoSharingRepository>(PHOTO_SHARING_KEY.REPOSITORY)
    .toDynamicValue(
      ({ container }) =>
        new PrismaPhotoSharingRepository(
          container.get<PrismaClient>(PRISMA_CLIENT),
          container.get<IEventBus>(EVENT_BUS),
          container.get<IPhotoDomainEventDispatcherPort>(
            PHOTO_SHARING_KEY.PORT.EVENT_DISPATCHER,
          ),
        ),
    )
    .inTransientScope();

  bind<SendPhotoUseCase>(PHOTO_SHARING_KEY.USE_CASE.SEND_PHOTO)
    .to(SendPhotoUseCase)
    .inTransientScope();

  bind<GetPhotoFeedUseCase>(PHOTO_SHARING_KEY.USE_CASE.GET_FEED)
    .to(GetPhotoFeedUseCase)
    .inTransientScope();

  bind<GetAllPhotosUseCase>(PHOTO_SHARING_KEY.USE_CASE.GET_ALL_PHOTOS)
    .to(GetAllPhotosUseCase)
    .inTransientScope();

  bind<GetMyPhotosUseCase>(PHOTO_SHARING_KEY.USE_CASE.GET_MY_PHOTOS)
    .to(GetMyPhotosUseCase)
    .inTransientScope();

  bind<UpdateMyPhotoCaptionUseCase>(
    PHOTO_SHARING_KEY.USE_CASE.UPDATE_MY_PHOTO_CAPTION,
  )
    .to(UpdateMyPhotoCaptionUseCase)
    .inTransientScope();

  bind<DeleteMyPhotoUseCase>(PHOTO_SHARING_KEY.USE_CASE.DELETE_MY_PHOTO)
    .to(DeleteMyPhotoUseCase)
    .inTransientScope();

  bind<ReactToPhotoUseCase>(PHOTO_SHARING_KEY.USE_CASE.REACT_TO_PHOTO)
    .to(ReactToPhotoUseCase)
    .inTransientScope();

  bind<RemoveReactionUseCase>(PHOTO_SHARING_KEY.USE_CASE.REMOVE_REACTION)
    .to(RemoveReactionUseCase)
    .inTransientScope();
});
