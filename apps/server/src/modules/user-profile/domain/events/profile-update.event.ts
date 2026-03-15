import { DomainEvent } from "@/shared/domain";

export class ProfileUpdatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    aggregateVersion: number,
    public readonly payload: {
      username: string;
      bio: string;
    },
  ) {
    super({
      eventName: "ProfileUpdated",
      aggregateId,
      aggregateType: "Profile",
      aggregateVersion,
    });
  }
}
