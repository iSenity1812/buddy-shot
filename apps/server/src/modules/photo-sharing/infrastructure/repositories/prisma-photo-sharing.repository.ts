import { FriendshipStatus, Prisma, type PrismaClient } from "@prisma/client";
import { inject, injectable } from "inversify";
import type { IEventBus } from "@/shared/application";
import { EVENT_BUS } from "@/shared/shared-di.tokens";
import { PHOTO_SHARING_KEY } from "../../di/photo-sharing.token";
import type { IPhotoSharingRepository } from "../../domain/repositories/photo-sharing.repository.interface";
import type { Photo } from "../../domain/entities/photo";
import type { PhotoDelivery } from "../../domain/entities/photo-delivery";
import type { IPhotoDomainEventDispatcherPort } from "../../application/ports/photo-domain-event-dispatcher.port";

function buildReactionSummary(
  emojis: Array<string | null | undefined>,
): Array<{ emoji: string; count: number }> {
  const counter = new Map<string, number>();

  for (const emoji of emojis) {
    if (!emoji) {
      continue;
    }
    counter.set(emoji, (counter.get(emoji) ?? 0) + 1);
  }

  return Array.from(counter.entries())
    .map(([emoji, count]) => ({ emoji, count }))
    .sort((a, b) => b.count - a.count);
}

@injectable()
export class PrismaPhotoSharingRepository implements IPhotoSharingRepository {
  constructor(
    private readonly prisma: PrismaClient,

    @inject(EVENT_BUS)
    private readonly eventBus: IEventBus,

    @inject(PHOTO_SHARING_KEY.PORT.EVENT_DISPATCHER)
    private readonly eventDispatcher: IPhotoDomainEventDispatcherPort,
  ) {}

  async findEligibleRecipientIds(
    senderId: string,
    recipientIds: string[],
  ): Promise<string[]> {
    if (recipientIds.length === 0) {
      return [];
    }

    const eligibleUsers = await this.prisma.user.findMany({
      where: {
        id: { in: recipientIds },
        isActive: true,
        OR: [
          {
            sentFriendRequests: {
              some: {
                addresseeId: senderId,
                status: FriendshipStatus.ACCEPTED,
              },
            },
          },
          {
            receivedFriendRequests: {
              some: {
                requesterId: senderId,
                status: FriendshipStatus.ACCEPTED,
              },
            },
          },
        ],
      },
      select: { id: true },
    });

    return eligibleUsers.map((user) => user.id);
  }

  async savePhotoWithDeliveries(
    photo: Photo,
    deliveries: PhotoDelivery[],
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.photo.create({
        data: {
          id: photo.id,
          senderId: photo.senderId,
          imageKey: photo.imageKey,
          caption: photo.caption,
          expiresAt: photo.expiresAt,
          createdAt: photo.createdAt,
        },
      });

      if (deliveries.length > 0) {
        await tx.photoRecipient.createMany({
          data: deliveries.map((delivery) => ({
            id: delivery.id,
            photoId: delivery.photoId,
            recipientId: delivery.recipientId,
            isViewed: false,
            viewedAt: null,
            deliveredAt: delivery.deliveredAt,
            createdAt: delivery.createdAt,
            version: 1,
          })),
        });
      }
    });

    const events = [
      ...photo.pullDomainEvents(),
      ...deliveries.flatMap((delivery) => delivery.pullDomainEvents()),
    ];

    if (events.length === 0) {
      return;
    }

    await this.eventBus.publishAll(events);
    await this.eventDispatcher.dispatch(events);
  }

  async listFeed(query: {
    userId: string;
    username?: string;
    from?: Date;
    to?: Date;
    page: number;
    limit: number;
    sort: "asc" | "desc";
  }): Promise<{
    items: Array<{
      photoId: string;
      senderId: string;
      senderUsername: string;
      senderAvatarKey: string | null;
      photoRecipientId: string | null;
      imageKey: string;
      caption: string | null;
      myReaction: string | null;
      reactionSummary: Array<{ emoji: string; count: number }>;
      createdAt: Date;
      deliveredAt: Date | null;
    }>;
    total: number;
  }> {
    const where: Prisma.PhotoRecipientWhereInput = {
      recipientId: query.userId,
      photo: {
        ...(query.username
          ? {
              sender: {
                username: {
                  contains: query.username,
                  mode: "insensitive",
                },
              },
            }
          : {}),
        ...(query.from || query.to
          ? {
              createdAt: {
                ...(query.from ? { gte: query.from } : {}),
                ...(query.to ? { lte: query.to } : {}),
              },
            }
          : {}),
      },
    };

    const [total, records] = await Promise.all([
      this.prisma.photoRecipient.count({ where }),
      this.prisma.photoRecipient.findMany({
        where,
        include: {
          reaction: {
            select: {
              emoji: true,
            },
          },
          photo: {
            include: {
              sender: {
                select: {
                  id: true,
                  username: true,
                  avatarKey: true,
                },
              },
              recipients: {
                select: {
                  reaction: {
                    select: {
                      emoji: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          photo: {
            createdAt: query.sort,
          },
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
    ]);

    return {
      total,
      items: records.map((item) => ({
        photoId: item.photoId,
        photoRecipientId: item.id,
        senderId: item.photo.sender.id,
        senderUsername: item.photo.sender.username,
        senderAvatarKey: item.photo.sender.avatarKey,
        imageKey: item.photo.imageKey,
        caption: item.photo.caption,
        myReaction: item.reaction?.emoji ?? null,
        reactionSummary: buildReactionSummary(
          item.photo.recipients.map((recipient) => recipient.reaction?.emoji),
        ),
        createdAt: item.photo.createdAt,
        deliveredAt: item.deliveredAt,
      })),
    };
  }

  async listAllRelatedPhotos(query: {
    userId: string;
    username?: string;
    from?: Date;
    to?: Date;
    page: number;
    limit: number;
    sort: "asc" | "desc";
  }): Promise<{
    items: Array<{
      photoId: string;
      senderId: string;
      senderUsername: string;
      senderAvatarKey: string | null;
      photoRecipientId: string | null;
      imageKey: string;
      caption: string | null;
      myReaction: string | null;
      reactionSummary: Array<{ emoji: string; count: number }>;
      createdAt: Date;
      deliveredAt: Date | null;
    }>;
    total: number;
  }> {
    const where: Prisma.PhotoWhereInput = {
      OR: [
        { senderId: query.userId },
        {
          recipients: {
            some: {
              recipientId: query.userId,
            },
          },
        },
      ],
      ...(query.username
        ? {
            sender: {
              username: {
                contains: query.username,
                mode: "insensitive",
              },
            },
          }
        : {}),
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from ? { gte: query.from } : {}),
              ...(query.to ? { lte: query.to } : {}),
            },
          }
        : {}),
    };

    const [total, records] = await Promise.all([
      this.prisma.photo.count({ where }),
      this.prisma.photo.findMany({
        where,
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              avatarKey: true,
            },
          },
          recipients: {
            select: {
              id: true,
              recipientId: true,
              deliveredAt: true,
              reaction: {
                select: {
                  emoji: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: query.sort,
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
    ]);

    return {
      total,
      items: records.map((item) => ({
        photoId: item.id,
        photoRecipientId:
          item.recipients.find((recipient) => recipient.recipientId === query.userId)
            ?.id ?? null,
        senderId: item.sender.id,
        senderUsername: item.sender.username,
        senderAvatarKey: item.sender.avatarKey,
        imageKey: item.imageKey,
        caption: item.caption,
        myReaction:
          item.recipients.find((recipient) => recipient.recipientId === query.userId)
            ?.reaction?.emoji ?? null,
        reactionSummary: buildReactionSummary(
          item.recipients.map((recipient) => recipient.reaction?.emoji),
        ),
        createdAt: item.createdAt,
        deliveredAt:
          item.recipients.find((recipient) => recipient.recipientId === query.userId)
            ?.deliveredAt ?? null,
      })),
    };
  }

  async listMyPhotos(query: {
    userId: string;
    from?: Date;
    to?: Date;
    page: number;
    limit: number;
    sort: "asc" | "desc";
  }): Promise<{
    items: Array<{
      photoId: string;
      senderId: string;
      senderUsername: string;
      senderAvatarKey: string | null;
      photoRecipientId: string | null;
      imageKey: string;
      caption: string | null;
      myReaction: string | null;
      reactionSummary: Array<{ emoji: string; count: number }>;
      createdAt: Date;
      deliveredAt: Date | null;
    }>;
    total: number;
  }> {
    const where: Prisma.PhotoWhereInput = {
      senderId: query.userId,
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from ? { gte: query.from } : {}),
              ...(query.to ? { lte: query.to } : {}),
            },
          }
        : {}),
    };

    const [total, records] = await Promise.all([
      this.prisma.photo.count({ where }),
      this.prisma.photo.findMany({
        where,
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              avatarKey: true,
            },
          },
          recipients: {
            select: {
              reaction: {
                select: {
                  emoji: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: query.sort,
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
    ]);

    return {
      total,
      items: records.map((item) => ({
        photoId: item.id,
        photoRecipientId: null,
        senderId: item.sender.id,
        senderUsername: item.sender.username,
        senderAvatarKey: item.sender.avatarKey,
        imageKey: item.imageKey,
        caption: item.caption,
        myReaction: null,
        reactionSummary: buildReactionSummary(
          item.recipients.map((recipient) => recipient.reaction?.emoji),
        ),
        createdAt: item.createdAt,
        deliveredAt: null,
      })),
    };
  }

  async updateOwnPhotoCaption(input: {
    userId: string;
    photoId: string;
    caption: string;
  }): Promise<boolean> {
    const updated = await this.prisma.photo.updateMany({
      where: {
        id: input.photoId,
        senderId: input.userId,
      },
      data: {
        caption: input.caption,
      },
    });

    return updated.count > 0;
  }

  async listAudienceUserIdsForOwnPhoto(input: {
    userId: string;
    photoId: string;
  }): Promise<string[]> {
    const photo = await this.prisma.photo.findFirst({
      where: {
        id: input.photoId,
        senderId: input.userId,
      },
      select: {
        senderId: true,
        recipients: {
          select: {
            recipientId: true,
          },
        },
      },
    });

    if (!photo) {
      return [];
    }

    return Array.from(
      new Set([
        photo.senderId,
        ...photo.recipients.map((recipient) => recipient.recipientId),
      ]),
    );
  }

  async deleteOwnPhoto(input: {
    userId: string;
    photoId: string;
  }): Promise<boolean> {
    const deleted = await this.prisma.photo.deleteMany({
      where: {
        id: input.photoId,
        senderId: input.userId,
      },
    });

    return deleted.count > 0;
  }

  async reactToPhotoRecipient(input: {
    userId: string;
    photoRecipientId: string;
    emoji: string;
  }): Promise<
    | {
        status: "added" | "changed" | "unchanged";
        photoId: string;
        photoRecipientId: string;
        previousEmoji: string | null;
        emoji: string;
        audienceUserIds: string[];
      }
    | null
  > {
    const updated = await this.prisma.$transaction(async (tx) => {
      const recipient = await tx.photoRecipient.findFirst({
        where: {
          id: input.photoRecipientId,
          recipientId: input.userId,
        },
        select: {
          id: true,
          photoId: true,
          reaction: {
            select: {
              emoji: true,
            },
          },
          photo: {
            select: {
              senderId: true,
              recipients: {
                select: {
                  recipientId: true,
                },
              },
            },
          },
        },
      });

      if (!recipient) {
        return null;
      }

      let status: "added" | "changed" | "unchanged" = "unchanged";
      const currentEmoji = recipient.reaction?.emoji ?? null;

      if (!currentEmoji) {
        await tx.reaction.create({
          data: {
            photoRecipientId: recipient.id,
            userId: input.userId,
            emoji: input.emoji,
          },
        });
        status = "added";
      } else if (currentEmoji !== input.emoji) {
        await tx.reaction.updateMany({
          where: {
            photoRecipientId: recipient.id,
            userId: input.userId,
          },
          data: {
            emoji: input.emoji,
          },
        });
        status = "changed";
      }

      const audienceUserIds = Array.from(
        new Set([
          recipient.photo.senderId,
          ...recipient.photo.recipients.map((item) => item.recipientId),
        ]),
      );

      return {
        status,
        photoId: recipient.photoId,
        photoRecipientId: recipient.id,
        previousEmoji: currentEmoji,
        emoji: input.emoji,
        audienceUserIds,
      };
    });

    return updated;
  }

  async removeReactionFromPhotoRecipient(input: {
    userId: string;
    photoRecipientId: string;
  }): Promise<
    | {
        status: "removed" | "not_found";
        photoId: string;
        photoRecipientId: string;
        emoji: string | null;
        audienceUserIds: string[];
      }
    | null
  > {
    const updated = await this.prisma.$transaction(async (tx) => {
      const recipient = await tx.photoRecipient.findFirst({
        where: {
          id: input.photoRecipientId,
          recipientId: input.userId,
        },
        select: {
          id: true,
          photoId: true,
          reaction: {
            select: {
              emoji: true,
            },
          },
          photo: {
            select: {
              senderId: true,
              recipients: {
                select: {
                  recipientId: true,
                },
              },
            },
          },
        },
      });

      if (!recipient) {
        return null;
      }

      const previousEmoji = recipient.reaction?.emoji ?? null;
      if (previousEmoji) {
        await tx.reaction.deleteMany({
          where: {
            photoRecipientId: recipient.id,
            userId: input.userId,
          },
        });
      }

      const audienceUserIds = Array.from(
        new Set([
          recipient.photo.senderId,
          ...recipient.photo.recipients.map((item) => item.recipientId),
        ]),
      );

      return {
        status: previousEmoji ? "removed" : "not_found",
        photoId: recipient.photoId,
        photoRecipientId: recipient.id,
        emoji: previousEmoji,
        audienceUserIds,
      };
    });

    return updated;
  }
}
