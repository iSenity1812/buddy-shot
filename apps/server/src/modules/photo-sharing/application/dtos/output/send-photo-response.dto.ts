export interface SendPhotoResponseDto {
  photoId: string;
  senderId: string;
  imageKey: string;
  imageUrl: string;
  caption: string | null;
  recipients: Array<{
    recipientId: string;
    deliveryId: string;
  }>;
  createdAt: string;
}
