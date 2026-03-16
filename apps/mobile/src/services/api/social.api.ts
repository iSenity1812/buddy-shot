import { Friend, FriendRequest } from "@/src/types/User";
import { httpClient } from "@/src/services/http/axios.config";

export type SearchRelationshipStatus =
  | "NONE"
  | "FRIEND"
  | "PENDING_INCOMING"
  | "PENDING_OUTGOING";

export interface SearchUser {
  userId: string;
  username: string;
  bio: string | null;
  avatarKey: string | null;
  relationshipStatus: SearchRelationshipStatus;
}

interface SocialUserDto {
  userId: string;
  username: string;
  bio?: string | null;
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

function fallbackAvatar(username: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=0D8ABC&color=fff`;
}

function resolveAvatar(username: string, avatarKey?: string | null): string {
  if (avatarKey && /^https?:\/\//i.test(avatarKey)) {
    return avatarKey;
  }

  return fallbackAvatar(username);
}

function mapSocialUserToFriend(user: SocialUserDto): Friend {
  return {
    id: user.userId,
    name: user.username,
    avatar: resolveAvatar(user.username, user.avatarKey),
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

    return httpClient.get<SearchUser[]>(`${SOCIAL_ENDPOINTS.searchUsers}?${params.toString()}`);
  },

  async listFriends(): Promise<Friend[]> {
    const data = await httpClient.get<SocialUserDto[]>(SOCIAL_ENDPOINTS.friends);
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
    return httpClient.delete<void>(SOCIAL_ENDPOINTS.friendByUserId(friendUserId));
  },
};
