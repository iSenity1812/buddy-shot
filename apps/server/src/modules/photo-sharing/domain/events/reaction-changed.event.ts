import { DomainEvent } from "@/shared/domain";

export class ReactionChangedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    aggregateVersion: number,
    public readonly payload: {
      photoId: string;
      photoRecipientId: string;
      userId: string;
      previousEmoji: string | null;
      emoji: string;
      audienceUserIds: string[];
    },
  ) {
    super({
      eventName: "ReactionChanged",
      aggregateId,
      aggregateType: "Reaction",
      aggregateVersion,
    });
  }
}
