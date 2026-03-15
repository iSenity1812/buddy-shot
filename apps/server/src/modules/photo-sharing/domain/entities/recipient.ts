import { AggregateRoot } from "@/shared/domain";
import type { RecipientProps } from "./recipient.props";
import { PhotoSharingValidationError } from "../errors/photo-sharing.error";

export class Recipient extends AggregateRoot<RecipientProps> {
  private constructor(props: RecipientProps) {
    super(props);
  }

  static create(userId: string): Recipient {
    const trimmed = userId.trim();
    if (!trimmed) {
      throw new PhotoSharingValidationError("Recipient userId is required.");
    }

    const now = new Date();
    return new Recipient({
      id: trimmed,
      userId: trimmed,
      createdAt: now,
      updatedAt: now,
      version: 0,
    });
  }

  get userId(): string {
    return this.props.userId;
  }
}
