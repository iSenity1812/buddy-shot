import type { FriendshipStatus } from "@prisma/client";

export interface ReconstituteFriendshipInput {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: FriendshipStatus;
  createdAt: Date;
  updatedAt: Date;
}
