export interface FriendRequestDto {
  friendshipId: string;
  requesterId: string;
  addresseeId: string;
  status: "PENDING" | "ACCEPTED";
  createdAt: string;
  updatedAt: string;
}

export interface PendingFriendRequestDto {
  friendshipId: string;
  status: "PENDING" | "ACCEPTED";
  direction: "INCOMING" | "OUTGOING";
  counterpart: {
    userId: string;
    username: string;
    bio: string | null;
    avatarKey: string | null;
    avatarUrl: string | null;
  };
  createdAt: string;
  updatedAt: string;
}
