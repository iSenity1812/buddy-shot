import { DomainEvent } from "@/shared/domain";

export class PhotoSentEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    aggregateVersion: number,
    public readonly payload: {
      senderId: string;
      imageKey: string;
      caption: string | null;
    },
  ) {
    super({
      eventName: "PhotoSent",
      aggregateId,
      aggregateType: "Photo",
      aggregateVersion,
    });
  }
}
