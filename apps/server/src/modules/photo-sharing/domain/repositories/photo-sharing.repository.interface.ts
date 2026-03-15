import type { Photo } from "../entities/photo";
import type { PhotoDelivery } from "../entities/photo-delivery";

export interface PhotoFeedQuery {
  userId: string;
  username?: string;
  from?: Date;
  to?: Date;
  page: number;
  limit: number;
  sort: "asc" | "desc";
}

export interface PhotoFeedProjection {
  photoId: string;
  senderId: string;
  senderUsername: string;
  senderAvatarKey: string | null;
  imageKey: string;
  caption: string | null;
  createdAt: Date;
  deliveredAt: Date | null;
}

export interface IPhotoSharingRepository {
  findEligibleRecipientIds(
    senderId: string,
    recipientIds: string[],
  ): Promise<string[]>;

  savePhotoWithDeliveries(
    photo: Photo,
    deliveries: PhotoDelivery[],
  ): Promise<void>;

  listFeed(
    query: PhotoFeedQuery,
  ): Promise<{ items: PhotoFeedProjection[]; total: number }>;
}
