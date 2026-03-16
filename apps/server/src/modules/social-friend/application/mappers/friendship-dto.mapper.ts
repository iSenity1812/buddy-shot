import type {
  FriendUserProjection,
  PendingFriendRequestProjection,
  SearchUserProjection,
} from "../../domain/repositories/friendship.repository.interface";
import { envConfig } from "@/shared/config/env.config";
import type { Friendship } from "../../domain/entities/friendship";
import type {
  FriendRequestDto,
  PendingFriendRequestDto,
} from "../dtos/output/friend-request.dto";
import type { FriendUserDto } from "../dtos/output/friend-user.dto";
import type { SearchUserDto } from "../dtos/output/search-user.dto";

function resolveAvatarUrl(avatarKey: string | null): string | null {
  if (!avatarKey) {
    return null;
  }

  if (/^https?:\/\//i.test(avatarKey)) {
    return avatarKey;
  }

  const base = envConfig.cloudflare.r2PublicUrlBase.trim();
  if (!base) {
    return null;
  }

  return `${base.replace(/\/+$/, "")}/${avatarKey.replace(/^\/+/, "")}`;
}

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
        avatarUrl: resolveAvatarUrl(input.counterpart.avatarKey),
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
      avatarUrl: resolveAvatarUrl(input.avatarKey),
    };
  }

  static toSearchUserDto(input: SearchUserProjection): SearchUserDto {
    return {
      userId: input.userId,
      username: input.username,
      bio: input.bio,
      avatarKey: input.avatarKey,
      avatarUrl: resolveAvatarUrl(input.avatarKey),
      relationshipStatus: input.relationshipStatus,
    };
  }
}
