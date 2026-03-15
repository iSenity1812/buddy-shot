import { DomainEvent } from "@/shared/domain";

/**
 * Raised when a user changes or removes their avatar.
 *
 * Media Storage module listens to this event to:
 *  - Delete the old R2 object (if oldAvatarKey !== null)
 *  - Confirm the new object is in use (prevents orphan cleanup race)
 */
export class AvatarChangedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    aggregateVersion: number,
    public readonly payload: {
      oldAvatarKey: string | null;
      newAvatarKey: string | null;
    },
  ) {
    super({
      eventName: "AvatarChanged",
      aggregateId,
      aggregateType: "Profile",
      aggregateVersion,
    });
  }
}
