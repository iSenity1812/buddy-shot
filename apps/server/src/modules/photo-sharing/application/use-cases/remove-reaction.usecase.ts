import type { IUseCase, IEventBus } from "@/shared/application";
import { EVENT_BUS } from "@/shared/shared-di.tokens";
import { inject, injectable } from "inversify";
import { ForbiddenError } from "@/shared/errors/domain-error";
import { PHOTO_SHARING_KEY } from "../../di/photo-sharing.token";
import type { IPhotoSharingRepository } from "../../domain/repositories/photo-sharing.repository.interface";
import type { IPhotoDomainEventDispatcherPort } from "../ports/photo-domain-event-dispatcher.port";
import type { RemoveReactionDto } from "../dtos/input/remove-reaction.dto";
import { ReactionRemovedEvent } from "../../domain/events/reaction-removed.event";

@injectable()
export class RemoveReactionUseCase
  implements
    IUseCase<
      RemoveReactionDto,
      { photoRecipientId: string; action: "removed" | "not_found" }
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

  async execute(input: RemoveReactionDto): Promise<{
    photoRecipientId: string;
    action: "removed" | "not_found";
  }> {
    const userId = input.userId?.trim();
    const photoRecipientId = input.photoRecipientId?.trim();

    if (!userId) {
      throw new ForbiddenError("Authentication required.");
    }

    if (!photoRecipientId) {
      throw new ForbiddenError("photoRecipientId is required.");
    }

    const result = await this.repository.removeReactionFromPhotoRecipient({
      userId,
      photoRecipientId,
    });

    if (!result) {
      throw new ForbiddenError(
        "You can only remove reaction from your received photos.",
      );
    }

    if (result.status === "not_found") {
      return {
        photoRecipientId,
        action: "not_found",
      };
    }

    const event = new ReactionRemovedEvent(result.photoRecipientId, 1, {
      photoId: result.photoId,
      photoRecipientId: result.photoRecipientId,
      userId,
      emoji: result.emoji ?? "",
      audienceUserIds: result.audienceUserIds,
    });

    await this.eventBus.publish(event);
    await this.eventDispatcher.dispatch([event]);

    return {
      photoRecipientId,
      action: "removed",
    };
  }
}
