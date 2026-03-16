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
  photoRecipientId: string | null;
  senderId: string;
  senderUsername: string;
  senderAvatarKey: string | null;
  imageKey: string;
  caption: string | null;
  myReaction: string | null;
  reactionSummary: Array<{
    emoji: string;
    count: number;
  }>;
  createdAt: Date;
  deliveredAt: Date | null;
}

export interface ReactToPhotoResult {
  status: "added" | "changed" | "unchanged";
  photoId: string;
  photoRecipientId: string;
  previousEmoji: string | null;
  emoji: string;
  audienceUserIds: string[];
}

export interface RemoveReactionResult {
  status: "removed" | "not_found";
  photoId: string;
  photoRecipientId: string;
  emoji: string | null;
  audienceUserIds: string[];
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

  listAllRelatedPhotos(
    query: PhotoFeedQuery,
  ): Promise<{ items: PhotoFeedProjection[]; total: number }>;

  listMyPhotos(
    query: Omit<PhotoFeedQuery, "username">,
  ): Promise<{ items: PhotoFeedProjection[]; total: number }>;

  updateOwnPhotoCaption(input: {
    userId: string;
    photoId: string;
    caption: string;
  }): Promise<boolean>;

  listAudienceUserIdsForOwnPhoto(input: {
    userId: string;
    photoId: string;
  }): Promise<string[]>;

  reactToPhotoRecipient(input: {
    userId: string;
    photoRecipientId: string;
    emoji: string;
  }): Promise<ReactToPhotoResult | null>;

  removeReactionFromPhotoRecipient(input: {
    userId: string;
    photoRecipientId: string;
  }): Promise<RemoveReactionResult | null>;

  deleteOwnPhoto(input: { userId: string; photoId: string }): Promise<boolean>;
}
