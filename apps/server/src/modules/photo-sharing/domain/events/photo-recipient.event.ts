import { DomainEvent } from "@/shared/domain";

export class PhotoRecipientEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    aggregateVersion: number,
    public readonly payload: {
      photoId: string;
      deliveryId: string;
      recipientId: string;
      senderId: string;
      imageKey: string;
      caption: string | null;
    },
  ) {
    super({
      eventName: "PhotoRecipient",
      aggregateId,
      aggregateType: "PhotoDelivery",
      aggregateVersion,
    });
  }
}
