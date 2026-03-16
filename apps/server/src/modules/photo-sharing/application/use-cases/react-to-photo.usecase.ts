import type { IUseCase, IEventBus } from "@/shared/application";
import { EVENT_BUS } from "@/shared/shared-di.tokens";
import { inject, injectable } from "inversify";
import { ForbiddenError } from "@/shared/errors/domain-error";
import { PHOTO_SHARING_KEY } from "../../di/photo-sharing.token";
import type { IPhotoSharingRepository } from "../../domain/repositories/photo-sharing.repository.interface";
import type { IPhotoDomainEventDispatcherPort } from "../ports/photo-domain-event-dispatcher.port";
import type { ReactToPhotoDto } from "../dtos/input/react-to-photo.dto";
import { ReactionEmoji } from "../../domain/value-objects/reaction-emoji.vo";
import { ReactionAddedEvent } from "../../domain/events/reaction-added.event";
import { ReactionChangedEvent } from "../../domain/events/reaction-changed.event";

@injectable()
export class ReactToPhotoUseCase
  implements
    IUseCase<
      ReactToPhotoDto,
      {
        photoRecipientId: string;
        emoji: string;
        action: "added" | "changed" | "unchanged";
      }
    >
{
  constructor(
    @inject(PHOTO_SHARING_KEY.REPOSITORY)
    private readonly repository: IPhotoSharingRepository,

    @inject(PHOTO_SHARING_KEY.PORT.EVENT_DISPATCHER)
    private readonly eventDispatcher: IPhotoDomainEventDispatcherPort,

    @inject(EVENT_BUS)
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: ReactToPhotoDto): Promise<{
    photoRecipientId: string;
    emoji: string;
    action: "added" | "changed" | "unchanged";
  }> {
    const userId = input.userId?.trim();
    const photoRecipientId = input.photoRecipientId?.trim();
    const emoji = input.emoji?.trim();

    if (!userId) {
      throw new ForbiddenError("Authentication required.");
    }

    if (!photoRecipientId) {
      throw new ForbiddenError("photoRecipientId is required.");
    }

    ReactionEmoji.assertAllowed(emoji);

    const result = await this.repository.reactToPhotoRecipient({
      userId,
      photoRecipientId,
      emoji,
    });

    if (!result) {
      throw new ForbiddenError("You can only react to your received photos.");
    }

    if (result.status === "unchanged") {
      return {
        photoRecipientId,
        emoji: result.emoji,
        action: "unchanged",
      };
    }

    const event =
      result.status === "added"
        ? new ReactionAddedEvent(result.photoRecipientId, 1, {
            photoId: result.photoId,
            photoRecipientId: result.photoRecipientId,
            userId,
            emoji: result.emoji,
            audienceUserIds: result.audienceUserIds,
          })
        : new ReactionChangedEvent(result.photoRecipientId, 1, {
            photoId: result.photoId,
            photoRecipientId: result.photoRecipientId,
            userId,
            previousEmoji: result.previousEmoji,
            emoji: result.emoji,
            audienceUserIds: result.audienceUserIds,
          });

    await this.eventBus.publish(event);
    await this.eventDispatcher.dispatch([event]);

    return {
      photoRecipientId,
      emoji: result.emoji,
      action: result.status,
    };
  }
}
