export interface PhotoRecipientNotification {
  photoId: string;
  deliveryId: string;
  recipientId: string;
  senderId: string;
  imageUrl: string;
  caption: string | null;
  occurredAt: string;
}

export interface IPhotoRealtimePort {
  notifyRecipientDelivery(payload: PhotoRecipientNotification): Promise<void>;
}
