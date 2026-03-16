export const SOCKET_EVENT = {
  READY: "socket:ready",
  PHOTO_RECIPIENT: "photo:recipient",
  PHOTO_CAPTION_UPDATED: "photo:caption-updated",
  PHOTO_DELETED: "photo:deleted",
  PROFILE_AVATAR_CHANGED: "profile:avatar-changed",
} as const;

export interface PhotoRecipientSocketPayload {
  photoId: string;
  deliveryId: string;
  recipientId: string;
  senderId: string;
  imageUrl: string;
  caption: string | null;
  occurredAt: string;
}

export interface PhotoCaptionUpdatedSocketPayload {
  photoId: string;
  caption: string;
  actorUserId: string;
}

export interface PhotoDeletedSocketPayload {
  photoId: string;
  actorUserId: string;
}

export interface ProfileAvatarChangedSocketPayload {
  userId: string;
  username: string;
  avatarUrl: string | null;
}
