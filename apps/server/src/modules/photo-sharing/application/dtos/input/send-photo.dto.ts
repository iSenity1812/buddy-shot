export interface SendPhotoDto {
  senderId: string;
  imageKey: string;
  caption?: string | null;
  recipientIds: string[];
}
