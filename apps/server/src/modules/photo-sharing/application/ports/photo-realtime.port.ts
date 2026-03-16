export interface PhotoRecipientNotification {
  photoId: string;
  deliveryId: string;
  recipientId: string;
  senderId: string;
  imageUrl: string;
  caption: string | null;
  occurredAt: string;
}

export interface PhotoCaptionUpdatedNotification {
  photoId: string;
  caption: string;
  actorUserId: string;
  audienceUserIds: string[];
}

export interface PhotoDeletedNotification {
  photoId: string;
  actorUserId: string;
  audienceUserIds: string[];
}

export interface IPhotoRealtimePort {
  notifyRecipientDelivery(payload: PhotoRecipientNotification): Promise<void>;
  notifyPhotoCaptionUpdated(
    payload: PhotoCaptionUpdatedNotification,
  ): Promise<void>;
  notifyPhotoDeleted(payload: PhotoDeletedNotification): Promise<void>;
}
