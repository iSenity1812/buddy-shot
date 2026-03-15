import { FriendshipStatus, type PrismaClient } from "@prisma/client";
import { injectable } from "inversify";
import type { IEventBus } from "@/shared/application";
import type {
  FriendUserProjection,
  IFriendshipRepository,
  PendingFriendRequestProjection,
  SearchRelationshipStatus,
  SearchUserProjection,
} from "../../domain/repositories/friendship.repository.interface";
import { FriendshipMapper } from "../mappers/friendship.mapper";
import type { Friendship } from "../../domain/entities/friendship";

@injectable()
export class PrismaFriendshipRepository implements IFriendshipRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly eventBus: IEventBus,
  ) {}

  async findById(id: string): Promise<Friendship | null> {
    const record = await this.prisma.friendship.findUnique({ where: { id } });
    return record ? FriendshipMapper.toDomain(record) : null;
  }

  async findBetweenUsers(
    userAId: string,
    userBId: string,
  ): Promise<Friendship | null> {
    const record = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userAId, addresseeId: userBId },
          { requesterId: userBId, addresseeId: userAId },
        ],
      },
    });

    return record ? FriendshipMapper.toDomain(record) : null;
  }

  async save(friendship: Friendship): Promise<void> {
    const existing = await this.prisma.friendship.count({
      where: { id: friendship.id },
    });

    if (existing === 0) {
      await this.prisma.friendship.create({
        data: FriendshipMapper.toCreatePersistence(friendship),
      });
    } else {
      await this.prisma.friendship.update({
        where: { id: friendship.id },
        data: { status: friendship.status },
      });
    }

    if (friendship.hasPendingEvents()) {
      await this.eventBus.publishAll(friendship.pullDomainEvents());
    }
  }

  async deleteById(id: string): Promise<void> {
    await this.prisma.friendship.delete({ where: { id } });
  }

  async listIncomingPending(
    userId: string,
  ): Promise<PendingFriendRequestProjection[]> {
    const records = await this.prisma.friendship.findMany({
      where: {
        addresseeId: userId,
        status: FriendshipStatus.PENDING,
      },
      orderBy: { createdAt: "desc" },
      include: {
        requester: {
          select: {
            id: true,
            username: true,
            bio: true,
            avatarKey: true,
          },
        },
      },
    });

    return records.map((item) => ({
      friendship: FriendshipMapper.toDomain(item),
      direction: "INCOMING",
      counterpart: {
        userId: item.requester.id,
        username: item.requester.username,
        bio: item.requester.bio,
        avatarKey: item.requester.avatarKey,
      },
    }));
  }

  async listOutgoingPending(
    userId: string,
  ): Promise<PendingFriendRequestProjection[]> {
    const records = await this.prisma.friendship.findMany({
      where: {
        requesterId: userId,
        status: FriendshipStatus.PENDING,
      },
      orderBy: { createdAt: "desc" },
      include: {
        addressee: {
          select: {
            id: true,
            username: true,
            bio: true,
            avatarKey: true,
          },
        },
      },
    });

    return records.map((item) => ({
      friendship: FriendshipMapper.toDomain(item),
      direction: "OUTGOING",
      counterpart: {
        userId: item.addressee.id,
        username: item.addressee.username,
        bio: item.addressee.bio,
        avatarKey: item.addressee.avatarKey,
      },
    }));
  }

  async listFriends(userId: string): Promise<FriendUserProjection[]> {
    const records = await this.prisma.friendship.findMany({
      where: {
        status: FriendshipStatus.ACCEPTED,
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
      include: {
        requester: {
          select: {
            id: true,
            username: true,
            bio: true,
            avatarKey: true,
          },
        },
        addressee: {
          select: {
            id: true,
            username: true,
            bio: true,
            avatarKey: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return records.map((item) => {
      const counterpart =
        item.requesterId === userId ? item.addressee : item.requester;
      return {
        userId: counterpart.id,
        username: counterpart.username,
        bio: counterpart.bio,
        avatarKey: counterpart.avatarKey,
      };
    });
  }

  async removeAcceptedBetween(
    userAId: string,
    userBId: string,
  ): Promise<boolean> {
    const result = await this.prisma.friendship.deleteMany({
      where: {
        status: FriendshipStatus.ACCEPTED,
        OR: [
          { requesterId: userAId, addresseeId: userBId },
          { requesterId: userBId, addresseeId: userAId },
        ],
      },
    });

    return result.count > 0;
  }

  async searchUsersByUsername(
    userId: string,
    usernameQuery: string,
    limit: number,
  ): Promise<SearchUserProjection[]> {
    const users = await this.prisma.user.findMany({
      where: {
        isActive: true,
        id: { not: userId },
        username: {
          contains: usernameQuery,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        username: true,
        bio: true,
        avatarKey: true,
      },
      orderBy: { username: "asc" },
      take: limit,
    });

    if (users.length === 0) {
      return [];
    }

    const candidateIds = users.map((user) => user.id);
    const edges = await this.prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: userId, addresseeId: { in: candidateIds } },
          { requesterId: { in: candidateIds }, addresseeId: userId },
        ],
      },
      select: {
        requesterId: true,
        addresseeId: true,
        status: true,
      },
    });

    const relationMap = new Map<string, SearchRelationshipStatus>();
    for (const edge of edges) {
      const counterpartId =
        edge.requesterId === userId ? edge.addresseeId : edge.requesterId;

      if (edge.status === FriendshipStatus.ACCEPTED) {
        relationMap.set(counterpartId, "FRIEND");
        continue;
      }

      relationMap.set(
        counterpartId,
        edge.requesterId === userId ? "PENDING_OUTGOING" : "PENDING_INCOMING",
      );
    }

    return users.map((user) => ({
      userId: user.id,
      username: user.username,
      bio: user.bio,
      avatarKey: user.avatarKey,
      relationshipStatus: relationMap.get(user.id) ?? "NONE",
    }));
  }
}
