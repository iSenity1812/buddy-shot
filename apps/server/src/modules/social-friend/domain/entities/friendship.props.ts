import type { FriendshipStatus } from "@prisma/client";
import type { EntityBaseProps } from "@/shared/domain";

export interface FriendshipProps extends EntityBaseProps {
  requesterId: string;
  addresseeId: string;
  status: FriendshipStatus;
}
