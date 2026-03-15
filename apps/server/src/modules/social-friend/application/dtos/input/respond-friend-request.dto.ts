export type FriendRequestAction = "accept" | "reject";

export interface RespondFriendRequestDto {
  friendshipId: string;
  actorId: string;
  action: FriendRequestAction;
}
