import { PhotoPost } from "@/src/types/Photo";
import { API_BASE_URL, httpClient } from "@/src/services/http/axios.config";

interface PhotoFeedSenderDto {
  userId: string;
  username: string;
  avatarKey?: string | null;
}

interface PhotoFeedItemDto {
  photoId: string;
  photoRecipientId: string | null;
  sender: PhotoFeedSenderDto;
  imageKey: string;
  imageUrl: string;
  caption: string | null;
  myReaction: string | null;
  reactionSummary: {
    emoji: string;
    count: number;
  }[];
  createdAt: string;
  deliveredAt: string;
}

const PHOTOS_ENDPOINTS = {
  all: "/photos/all",
  me: "/photos/me",
  captionByPhotoId: (photoId: string) => `/photos/${photoId}/caption`,
  byPhotoId: (photoId: string) => `/photos/${photoId}`,
  reactionByPhotoRecipientId: (photoRecipientId: string) =>
    `/photos/recipients/${photoRecipientId}/reaction`,
} as const;

const r2PublicBaseUrl = process.env.EXPO_PUBLIC_R2_PUBLIC_URL_BASE?.replace(
  /\/+$/,
  "",
);

const apiOrigin = (() => {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return undefined;
  }
})();

export interface ListFeedParams {
  username?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
  sort?: "asc" | "desc";
}

function fallbackAvatar(username: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=0D8ABC&color=fff`;
}

function extractAvatarKey(value: string): string | null {
  if (!value) {
    return null;
  }

  if (/^https?:\/\//i.test(value)) {
    try {
      const parsed = new URL(value);
      const path = parsed.pathname.replace(/^\/+/, "");
      return path || null;
    } catch {
      return null;
    }
  }

  return value.replace(/^\/+/, "") || null;
}

function resolveAvatar(username: string, avatarKey?: string | null): string {
  const normalizedKey = avatarKey ? extractAvatarKey(avatarKey) : null;

  if (normalizedKey && r2PublicBaseUrl && /^avatars\//i.test(normalizedKey)) {
    return normalizeHostForDevice(`${r2PublicBaseUrl}/${normalizedKey}`);
  }

  if (avatarKey && /^https?:\/\//i.test(avatarKey)) {
    return normalizeHostForDevice(avatarKey);
  }

  if (normalizedKey && r2PublicBaseUrl) {
    return normalizeHostForDevice(`${r2PublicBaseUrl}/${normalizedKey}`);
  }

  if (normalizedKey && apiOrigin) {
    return `${apiOrigin}/${normalizedKey}`;
  }

  return fallbackAvatar(username);
}

function normalizeHostForDevice(url: string): string {
  if (!apiOrigin) {
    return url;
  }

  try {
    const parsed = new URL(url);
    if (
      parsed.hostname === "localhost" ||
      parsed.hostname === "127.0.0.1" ||
      parsed.hostname === "10.0.2.2"
    ) {
      const api = new URL(apiOrigin);
      parsed.protocol = api.protocol;
      parsed.hostname = api.hostname;
      parsed.port = api.port;
      return parsed.toString();
    }
  } catch {
    return url;
  }

  return url;
}

function resolveImageUrl(imageUrl: string, imageKey: string): string {
  if (/^https?:\/\//i.test(imageUrl)) {
    return normalizeHostForDevice(imageUrl);
  }

  if (r2PublicBaseUrl) {
    const normalizedKey = (imageKey || imageUrl).replace(/^\/+/, "");
    return normalizeHostForDevice(`${r2PublicBaseUrl}/${normalizedKey}`);
  }

  if (apiOrigin) {
    const normalizedKey = (imageKey || imageUrl).replace(/^\/+/, "");
    return `${apiOrigin}/${normalizedKey}`;
  }

  return imageUrl;
}

export const photosApi = {
  async listFeed(params?: ListFeedParams): Promise<PhotoPost[]> {
    const query = new URLSearchParams();

    if (params?.username?.trim()) {
      query.set("username", params.username.trim());
    }

    if (params?.from) {
      query.set("from", params.from);
    }

    if (params?.to) {
      query.set("to", params.to);
    }

    if (typeof params?.page === "number") {
      query.set("page", String(params.page));
    }

    if (typeof params?.limit === "number") {
      query.set("limit", String(params.limit));
    }

    if (params?.sort) {
      query.set("sort", params.sort);
    }

    const endpoint = query.toString()
      ? `${PHOTOS_ENDPOINTS.all}?${query.toString()}`
      : PHOTOS_ENDPOINTS.all;

    const data = await httpClient.get<PhotoFeedItemDto[]>(endpoint);

    return data.map((item) => ({
      id: item.photoId,
      photoRecipientId: item.photoRecipientId,
      imageUrl: resolveImageUrl(item.imageUrl, item.imageKey),
      message: item.caption ?? "",
      sender: {
        id: item.sender.userId,
        name: item.sender.username,
        avatar: resolveAvatar(item.sender.username, item.sender.avatarKey),
      },
      myReaction: item.myReaction,
      reactionSummary: item.reactionSummary,
      timestamp: new Date(item.createdAt),
    }));
  },

  async listMyPhotos(params?: Omit<ListFeedParams, "username">): Promise<PhotoPost[]> {
    const query = new URLSearchParams();

    if (params?.from) {
      query.set("from", params.from);
    }

    if (params?.to) {
      query.set("to", params.to);
    }

    if (typeof params?.page === "number") {
      query.set("page", String(params.page));
    }

    if (typeof params?.limit === "number") {
      query.set("limit", String(params.limit));
    }

    if (params?.sort) {
      query.set("sort", params.sort);
    }

    const endpoint = query.toString()
      ? `${PHOTOS_ENDPOINTS.me}?${query.toString()}`
      : PHOTOS_ENDPOINTS.me;

    const data = await httpClient.get<PhotoFeedItemDto[]>(endpoint);

    return data.map((item) => ({
      id: item.photoId,
      photoRecipientId: item.photoRecipientId,
      imageUrl: resolveImageUrl(item.imageUrl, item.imageKey),
      message: item.caption ?? "",
      sender: {
        id: item.sender.userId,
        name: item.sender.username,
        avatar: resolveAvatar(item.sender.username, item.sender.avatarKey),
      },
      myReaction: item.myReaction,
      reactionSummary: item.reactionSummary,
      timestamp: new Date(item.createdAt),
    }));
  },

  async updateMyPhotoCaption(photoId: string, caption: string): Promise<void> {
    await httpClient.patch<void, { caption: string }>(
      PHOTOS_ENDPOINTS.captionByPhotoId(photoId),
      { caption },
    );
  },

  async deleteMyPhoto(photoId: string): Promise<void> {
    await httpClient.delete<void>(PHOTOS_ENDPOINTS.byPhotoId(photoId));
  },

  async reactToPhotoRecipient(
    photoRecipientId: string,
    emoji: string,
  ): Promise<void> {
    await httpClient.patch<void, { emoji: string }>(
      PHOTOS_ENDPOINTS.reactionByPhotoRecipientId(photoRecipientId),
      { emoji },
    );
  },

  async removeReactionFromPhotoRecipient(photoRecipientId: string): Promise<void> {
    await httpClient.delete<void>(
      PHOTOS_ENDPOINTS.reactionByPhotoRecipientId(photoRecipientId),
    );
  },
};
