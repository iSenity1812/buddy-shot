export const SOCKET_EVENT = {
  READY: "socket:ready",
  PHOTO_RECIPIENT: "photo:recipient",
  PHOTO_CAPTION_UPDATED: "photo:caption-updated",
  PHOTO_DELETED: "photo:deleted",
  PROFILE_AVATAR_CHANGED: "profile:avatar-changed",
} as const;

export interface SocketReadyPayload {
  userId: string;
}

export interface PhotoCaptionUpdatedPayload {
  photoId: string;
  caption: string;
  actorUserId: string;
}

export interface PhotoDeletedPayload {
  photoId: string;
  actorUserId: string;
}

export interface ProfileAvatarChangedPayload {
  userId: string;
  username: string;
  avatarUrl: string | null;
}
