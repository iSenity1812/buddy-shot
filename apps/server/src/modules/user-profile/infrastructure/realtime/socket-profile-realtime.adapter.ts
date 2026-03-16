import { FriendshipStatus, type PrismaClient } from "@prisma/client";
import { inject, injectable } from "inversify";
import { PRISMA_CLIENT } from "@/shared/shared-di.tokens";
import { socketGateway } from "@/shared/realtime/socket.gateway";
import { SOCKET_EVENT } from "@/shared/realtime/socket-events";
import type {
  IProfileRealtimePort,
  ProfileAvatarChangedNotification,
} from "../../application/ports/profile-realtime.port";

@injectable()
export class SocketProfileRealtimeAdapter implements IProfileRealtimePort {
  constructor(@inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  async notifyAvatarChanged(
    payload: ProfileAvatarChangedNotification,
  ): Promise<void> {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        status: FriendshipStatus.ACCEPTED,
        OR: [{ requesterId: payload.userId }, { addresseeId: payload.userId }],
      },
      select: {
        requesterId: true,
        addresseeId: true,
      },
    });

    const audienceUserIds = new Set<string>([payload.userId]);
    for (const friendship of friendships) {
      audienceUserIds.add(friendship.requesterId);
      audienceUserIds.add(friendship.addresseeId);
    }

    for (const userId of audienceUserIds) {
      socketGateway.emitToUser(userId, SOCKET_EVENT.PROFILE_AVATAR_CHANGED, {
        userId: payload.userId,
        username: payload.username,
        avatarUrl: payload.avatarUrl,
      });
    }
  }
}
