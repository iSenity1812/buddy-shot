import { DomainEvent } from "@/shared/domain";

export class ReactionRemovedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    aggregateVersion: number,
    public readonly payload: {
      photoId: string;
      photoRecipientId: string;
      userId: string;
      emoji: string;
      audienceUserIds: string[];
    },
  ) {
    super({
      eventName: "ReactionRemoved",
      aggregateId,
      aggregateType: "Reaction",
      aggregateVersion,
    });
  }
}
