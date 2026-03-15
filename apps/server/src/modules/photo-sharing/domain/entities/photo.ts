import { AggregateRoot } from "@/shared/domain";
import type { PhotoProps } from "./photo.props";
import { PhotoSharingValidationError } from "../errors/photo-sharing.error";
import { PhotoSentEvent } from "../events/photo-sent.event";

export interface CreatePhotoInput {
  senderId: string;
  imageKey: string;
  caption?: string | null;
  expiresAt?: Date | null;
}

export class Photo extends AggregateRoot<PhotoProps> {
  private constructor(props: PhotoProps) {
    super(props);
  }

  static create(input: CreatePhotoInput): Photo {
    const senderId = input.senderId.trim();
    const imageKey = input.imageKey.trim();
    const caption = input.caption?.trim() ?? null;

    if (!senderId) {
      throw new PhotoSharingValidationError("senderId is required.");
    }

    if (!imageKey) {
      throw new PhotoSharingValidationError("imageKey is required.");
    }

    if (caption && caption.length > 100) {
      throw new PhotoSharingValidationError(
        "caption must be at most 100 characters.",
      );
    }

    const now = new Date();
    const photo = new Photo({
      id: crypto.randomUUID(),
      senderId,
      imageKey,
      caption,
      expiresAt: input.expiresAt ?? null,
      createdAt: now,
      updatedAt: now,
      version: 0,
    });

    photo.addEvent(
      new PhotoSentEvent(photo.id, photo.version, {
        senderId: photo.senderId,
        imageKey: photo.imageKey,
        caption: photo.caption,
      }),
    );

    return photo;
  }

  get senderId(): string {
    return this.props.senderId;
  }

  get imageKey(): string {
    return this.props.imageKey;
  }

  get caption(): string | null {
    return this.props.caption;
  }

  get expiresAt(): Date | null {
    return this.props.expiresAt;
  }
}
