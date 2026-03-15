import { AggregateRoot } from "@/shared/domain";
import type { PhotoDeliveryProps } from "./photo-delivery.props";
import { PhotoSharingValidationError } from "../errors/photo-sharing.error";
import { PhotoRecipientEvent } from "../events/photo-recipient.event";

export interface CreatePhotoDeliveryInput {
  photoId: string;
  recipientId: string;
  senderId: string;
  imageKey: string;
  caption: string | null;
}

export class PhotoDelivery extends AggregateRoot<PhotoDeliveryProps> {
  private constructor(props: PhotoDeliveryProps) {
    super(props);
  }

  static create(input: CreatePhotoDeliveryInput): PhotoDelivery {
    const photoId = input.photoId.trim();
    const recipientId = input.recipientId.trim();

    if (!photoId || !recipientId) {
      throw new PhotoSharingValidationError(
        "photoId and recipientId are required for delivery.",
      );
    }

    const now = new Date();
    const delivery = new PhotoDelivery({
      id: crypto.randomUUID(),
      photoId,
      recipientId,
      isViewed: false,
      viewedAt: null,
      deliveredAt: now,
      createdAt: now,
      updatedAt: now,
      version: 0,
    });

    delivery.addEvent(
      new PhotoRecipientEvent(delivery.id, delivery.version, {
        photoId,
        deliveryId: delivery.id,
        recipientId,
        senderId: input.senderId,
        imageKey: input.imageKey,
        caption: input.caption,
      }),
    );

    return delivery;
  }

  get photoId(): string {
    return this.props.photoId;
  }

  get recipientId(): string {
    return this.props.recipientId;
  }

  get deliveredAt(): Date | null {
    return this.props.deliveredAt;
  }
}
