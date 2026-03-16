import { PhotoPost } from "@/src/types/Photo";
import { httpClient } from "@/src/services/http/axios.config";

interface PhotoFeedSenderDto {
  userId: string;
  username: string;
  avatarKey?: string | null;
}

interface PhotoFeedItemDto {
  photoId: string;
  sender: PhotoFeedSenderDto;
  imageKey: string;
  imageUrl: string;
  caption: string | null;
  createdAt: string;
  deliveredAt: string;
}

const PHOTOS_ENDPOINTS = {
  feed: "/photos/feed",
} as const;

function fallbackAvatar(username: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=0D8ABC&color=fff`;
}

function resolveAvatar(username: string, avatarKey?: string | null): string {
  if (avatarKey && /^https?:\/\//i.test(avatarKey)) {
    return avatarKey;
  }

  return fallbackAvatar(username);
}

export const photosApi = {
  async listFeed(): Promise<PhotoPost[]> {
    const data = await httpClient.get<PhotoFeedItemDto[]>(PHOTOS_ENDPOINTS.feed);

    return data.map((item) => ({
      id: item.photoId,
      imageUrl: item.imageUrl,
      message: item.caption ?? "",
      sender: {
        id: item.sender.userId,
        name: item.sender.username,
        avatar: resolveAvatar(item.sender.username, item.sender.avatarKey),
      },
      timestamp: new Date(item.createdAt),
    }));
  },
};
