import { DomainEvent } from "@/shared/domain";

export class FriendRequestAcceptedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    aggregateVersion: number,
    public readonly payload: {
      requesterId: string;
      addresseeId: string;
    },
  ) {
    super({
      eventName: "FriendRequestAccepted",
      aggregateId,
      aggregateType: "Friendship",
      aggregateVersion,
    });
  }
}
