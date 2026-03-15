import { inject, injectable } from "inversify";
import type { IDomainEvent } from "@/shared/domain";
import { PHOTO_SHARING_KEY } from "../../di/photo-sharing.token";
import type { IPhotoDomainEventDispatcherPort } from "../../application/ports/photo-domain-event-dispatcher.port";
import type { IPhotoRealtimePort } from "../../application/ports/photo-realtime.port";
import type { IMediaStoragePort } from "../../application/ports/media-storage.port";
import { PhotoSentEvent } from "../../domain/events/photo-sent.event";
import { PhotoRecipientEvent } from "../../domain/events/photo-recipient.event";

@injectable()
export class PhotoEventDispatcher implements IPhotoDomainEventDispatcherPort {
  constructor(
    @inject(PHOTO_SHARING_KEY.PORT.REALTIME)
    private readonly realtime: IPhotoRealtimePort,

    @inject(PHOTO_SHARING_KEY.PORT.MEDIA_STORAGE)
    private readonly mediaStorage: IMediaStoragePort,
  ) {}

  async dispatch(events: IDomainEvent[]): Promise<void> {
    await Promise.allSettled(events.map((event) => this.handle(event)));
  }

  private async handle(event: IDomainEvent): Promise<void> {
    if (event instanceof PhotoSentEvent) {
      // Placeholder for async media pipeline hooks (thumbnail/CDN warmup/projection).
      this.mediaStorage.getPublicUrl(event.payload.imageKey);
      return;
    }

    if (event instanceof PhotoRecipientEvent) {
      await this.realtime.notifyRecipientDelivery({
        photoId: event.payload.photoId,
        deliveryId: event.payload.deliveryId,
        recipientId: event.payload.recipientId,
        senderId: event.payload.senderId,
        imageUrl: this.mediaStorage.getPublicUrl(event.payload.imageKey),
        caption: event.payload.caption,
        occurredAt: event.occurredAt.toISOString(),
      });
    }
  }
}
