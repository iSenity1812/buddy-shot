import type { Photo } from "../../domain/entities/photo";
import type { PhotoDelivery } from "../../domain/entities/photo-delivery";
import type { PhotoFeedProjection } from "../../domain/repositories/photo-sharing.repository.interface";
import type { SendPhotoResponseDto } from "../dtos/output/send-photo-response.dto";
import type {
  PhotoFeedItemDto,
  PhotoFeedResultDto,
} from "../dtos/output/photo-feed-item.dto";
import type { IMediaStoragePort } from "../ports/media-storage.port";

export class PhotoSharingDtoMapper {
  static toSendPhotoResponse(
    photo: Photo,
    deliveries: PhotoDelivery[],
    mediaStorage: IMediaStoragePort,
  ): SendPhotoResponseDto {
    return {
      photoId: photo.id,
      senderId: photo.senderId,
      imageKey: photo.imageKey,
      imageUrl: mediaStorage.getPublicUrl(photo.imageKey),
      caption: photo.caption,
      recipients: deliveries.map((delivery) => ({
        recipientId: delivery.recipientId,
        deliveryId: delivery.id,
      })),
      createdAt: photo.createdAt.toISOString(),
    };
  }

  static toFeedItem(
    projection: PhotoFeedProjection,
    mediaStorage: IMediaStoragePort,
  ): PhotoFeedItemDto {
    return {
      photoId: projection.photoId,
      sender: {
        userId: projection.senderId,
        username: projection.senderUsername,
        avatarKey: projection.senderAvatarKey,
      },
      imageKey: projection.imageKey,
      imageUrl: mediaStorage.getPublicUrl(projection.imageKey),
      caption: projection.caption,
      createdAt: projection.createdAt.toISOString(),
      deliveredAt: projection.deliveredAt
        ? projection.deliveredAt.toISOString()
        : null,
    };
  }

  static toFeedResult(
    items: PhotoFeedProjection[],
    total: number,
    page: number,
    limit: number,
    mediaStorage: IMediaStoragePort,
  ): PhotoFeedResultDto {
    return {
      items: items.map((item) => this.toFeedItem(item, mediaStorage)),
      total,
      page,
      limit,
    };
  }
}
