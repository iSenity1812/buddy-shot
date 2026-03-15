// ─── UserRegisteredEvent ──────────────────────────────────────────────────────

import { DomainEvent } from "@/shared/domain";

/**
 * Raised when a new user completes registration.
 *
 * Listeners:
 *  - user-profile module: creates the Profile aggregate with matching userId
 *  - notification module: sends welcome push/email
 */
export class UserRegisteredEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    aggregateVersion: number,
    public readonly payload: {
      email: string;
      username: string;
    },
  ) {
    super({
      eventName: "UserRegistered",
      aggregateId,
      aggregateType: "User",
      aggregateVersion,
    });
  }
}
