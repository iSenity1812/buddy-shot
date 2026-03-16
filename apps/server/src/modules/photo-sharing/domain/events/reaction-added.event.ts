import { DomainEvent } from "@/shared/domain";

export class ReactionAddedEvent extends DomainEvent {
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
      eventName: "ReactionAdded",
      aggregateId,
      aggregateType: "Reaction",
      aggregateVersion,
    });
  }
}
