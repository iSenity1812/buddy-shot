import type {
  FriendUserProjection,
  PendingFriendRequestProjection,
  SearchUserProjection,
} from "../../domain/repositories/friendship.repository.interface";
import type { Friendship } from "../../domain/entities/friendship";
import type {
  FriendRequestDto,
  PendingFriendRequestDto,
} from "../dtos/output/friend-request.dto";
import type { FriendUserDto } from "../dtos/output/friend-user.dto";
import type { SearchUserDto } from "../dtos/output/search-user.dto";

export class FriendshipDtoMapper {
  static toFriendRequestDto(friendship: Friendship): FriendRequestDto {
    return {
      friendshipId: friendship.id,
      requesterId: friendship.requesterId,
      addresseeId: friendship.addresseeId,
      status: friendship.status,
      createdAt: friendship.createdAt.toISOString(),
      updatedAt: friendship.updatedAt.toISOString(),
    };
  }

  static toPendingRequestDto(
    input: PendingFriendRequestProjection,
  ): PendingFriendRequestDto {
    return {
      friendshipId: input.friendship.id,
      status: input.friendship.status,
      direction: input.direction,
      counterpart: {
        userId: input.counterpart.userId,
        username: input.counterpart.username,
        bio: input.counterpart.bio,
        avatarKey: input.counterpart.avatarKey,
      },
      createdAt: input.friendship.createdAt.toISOString(),
      updatedAt: input.friendship.updatedAt.toISOString(),
    };
  }

  static toFriendUserDto(input: FriendUserProjection): FriendUserDto {
    return {
      userId: input.userId,
      username: input.username,
      bio: input.bio,
      avatarKey: input.avatarKey,
    };
  }

  static toSearchUserDto(input: SearchUserProjection): SearchUserDto {
    return {
      userId: input.userId,
      username: input.username,
      bio: input.bio,
      avatarKey: input.avatarKey,
      relationshipStatus: input.relationshipStatus,
    };
  }
}
