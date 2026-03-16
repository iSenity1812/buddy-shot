export const SOCKET_EVENT = {
  READY: "socket:ready",
  PHOTO_RECIPIENT: "photo:recipient",
  PHOTO_CAPTION_UPDATED: "photo:caption-updated",
  PHOTO_DELETED: "photo:deleted",
  PHOTO_REACTION_UPDATED: "photo:reaction-updated",
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

export interface PhotoReactionUpdatedPayload {
  photoId: string;
  photoRecipientId: string;
  userId: string;
  previousEmoji?: string | null;
  emoji: string;
  action: "added" | "changed" | "removed";
}

export interface ProfileAvatarChangedPayload {
  userId: string;
  username: string;
  avatarUrl: string | null;
}
