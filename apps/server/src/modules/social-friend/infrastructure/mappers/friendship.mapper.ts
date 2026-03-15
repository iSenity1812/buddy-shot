import type {
  Friendship as PrismaFriendship,
  FriendshipStatus,
} from "@prisma/client";
import { Friendship } from "../../domain/entities/friendship";

export class FriendshipMapper {
  static toDomain(record: PrismaFriendship): Friendship {
    return Friendship.reconstitute({
      id: record.id,
      requesterId: record.requesterId,
      addresseeId: record.addresseeId,
      status: record.status,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  static toCreatePersistence(friendship: Friendship): {
    id: string;
    requesterId: string;
    addresseeId: string;
    status: FriendshipStatus;
  } {
    return {
      id: friendship.id,
      requesterId: friendship.requesterId,
      addresseeId: friendship.addresseeId,
      status: friendship.status,
    };
  }
}
