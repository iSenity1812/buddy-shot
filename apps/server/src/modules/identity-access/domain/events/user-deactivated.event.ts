import { DomainEvent } from "@/shared/domain";

/**
 * Raised when a user account is deactivated.
 *
 * Listeners:
 *  - social module: remove from friend lists
 *  - notification module: stop push delivery
 */
export class UserDeactivatedEvent extends DomainEvent {
  constructor(aggregateId: string, aggregateVersion: number) {
    super({
      eventName: "UserDeactivated",
      aggregateId,
      aggregateType: "User",
      aggregateVersion,
    });
  }
}
