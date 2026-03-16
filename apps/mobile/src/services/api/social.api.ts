import { Friend, FriendRequest } from "@/src/types/User";
import { API_BASE_URL, httpClient } from "@/src/services/http/axios.config";

export type SearchRelationshipStatus =
  | "NONE"
  | "FRIEND"
  | "PENDING_INCOMING"
  | "PENDING_OUTGOING";

export interface SearchUser {
  userId: string;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  avatarKey: string | null;
  relationshipStatus: SearchRelationshipStatus;
}

interface SocialUserDto {
  userId: string;
  username: string;
  bio?: string | null;
  avatarUrl?: string | null;
  avatarKey?: string | null;
}

interface IncomingRequestDto {
  friendshipId: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  direction: "INCOMING" | "OUTGOING";
  counterpart: SocialUserDto;
  createdAt: string;
  updatedAt: string;
}

const SOCIAL_ENDPOINTS = {
  friends: "/social/friends",
  sendRequest: "/social/friends/requests",
  incomingRequests: "/social/friends/requests/incoming",
  searchUsers: "/social/friends/search",
  requestById: (friendshipId: string) =>
    `/social/friends/requests/${friendshipId}`,
  friendByUserId: (friendUserId: string) => `/social/friends/${friendUserId}`,
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

function resolveAvatar(avatarUrl?: string | null): string {
  if (!avatarUrl) {
    return "";
  }

  if (/^https?:\/\//i.test(avatarUrl)) {
    return normalizeHostForDevice(avatarUrl);
  }

  if (r2PublicBaseUrl) {
    const normalizedKey = avatarUrl.replace(/^\/+/, "");
    return normalizeHostForDevice(`${r2PublicBaseUrl}/${normalizedKey}`);
  }

  return normalizeHostForDevice(avatarUrl);
}

function mapSocialUserToFriend(user: SocialUserDto): Friend {
  return {
    id: user.userId,
    name: user.username,
    avatar: resolveAvatar(user.avatarUrl),
  };
}

export const socialApi = {
  sendFriendRequest(addresseeId: string): Promise<void> {
    return httpClient.post<void, { addresseeId: string }>(
      SOCIAL_ENDPOINTS.sendRequest,
      { addresseeId },
    );
  },

  searchUsersByUsername(username: string, limit = 10): Promise<SearchUser[]> {
    const params = new URLSearchParams({
      username,
      limit: String(limit),
    });

    return httpClient.get<SearchUser[]>(
      `${SOCIAL_ENDPOINTS.searchUsers}?${params.toString()}`,
    );
  },

  async listFriends(): Promise<Friend[]> {
    const data = await httpClient.get<SocialUserDto[]>(
      SOCIAL_ENDPOINTS.friends,
    );
    return data.map(mapSocialUserToFriend);
  },

  async listIncomingRequests(): Promise<FriendRequest[]> {
    const data = await httpClient.get<IncomingRequestDto[]>(
      SOCIAL_ENDPOINTS.incomingRequests,
    );

    return data.map((request) => ({
      id: request.friendshipId,
      sender: mapSocialUserToFriend(request.counterpart),
      createdAt: new Date(request.createdAt),
    }));
  },

  respondToRequest(
    friendshipId: string,
    action: "accept" | "reject",
  ): Promise<void> {
    return httpClient.patch<void, { action: "accept" | "reject" }>(
      SOCIAL_ENDPOINTS.requestById(friendshipId),
      { action },
    );
  },

  removeFriend(friendUserId: string): Promise<void> {
    return httpClient.delete<void>(
      SOCIAL_ENDPOINTS.friendByUserId(friendUserId),
    );
  },
};
