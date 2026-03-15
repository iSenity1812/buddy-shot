import { DomainEvent } from "@/shared/domain";

export class FriendRequestSentEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    aggregateVersion: number,
    public readonly payload: {
      requesterId: string;
      addresseeId: string;
    },
  ) {
    super({
      eventName: "FriendRequestSent",
      aggregateId,
      aggregateType: "Friendship",
      aggregateVersion,
    });
  }
}
