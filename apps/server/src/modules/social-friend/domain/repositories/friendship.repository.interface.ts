import type { Friendship } from "../entities/friendship";

export interface FriendUserProjection {
  userId: string;
  username: string;
  bio: string | null;
  avatarKey: string | null;
}

export interface PendingFriendRequestProjection {
  friendship: Friendship;
  counterpart: FriendUserProjection;
  direction: "INCOMING" | "OUTGOING";
}

export type SearchRelationshipStatus =
  | "NONE"
  | "FRIEND"
  | "PENDING_INCOMING"
  | "PENDING_OUTGOING";

export interface SearchUserProjection extends FriendUserProjection {
  relationshipStatus: SearchRelationshipStatus;
}

export interface IFriendshipRepository {
  findById(id: string): Promise<Friendship | null>;
  findBetweenUsers(
    userAId: string,
    userBId: string,
  ): Promise<Friendship | null>;

  save(friendship: Friendship): Promise<void>;
  deleteById(id: string): Promise<void>;

  listIncomingPending(
    userId: string,
  ): Promise<PendingFriendRequestProjection[]>;
  listOutgoingPending(
    userId: string,
  ): Promise<PendingFriendRequestProjection[]>;
  listFriends(userId: string): Promise<FriendUserProjection[]>;
  removeAcceptedBetween(userAId: string, userBId: string): Promise<boolean>;
  searchUsersByUsername(
    userId: string,
    usernameQuery: string,
    limit: number,
  ): Promise<SearchUserProjection[]>;
}
