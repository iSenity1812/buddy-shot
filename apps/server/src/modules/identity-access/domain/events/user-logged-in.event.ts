import { DomainEvent } from "@/shared/domain";

/**
 * Raised on successful login.
 * Useful for audit log / anomaly detection.
 */
export class UserLoggedInEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    aggregateVersion: number,
    public readonly payload: {
      deviceId: string;
      platform: string;
      ip?: string;
    },
  ) {
    super({
      eventName: "UserLoggedIn",
      aggregateId,
      aggregateType: "User",
      aggregateVersion,
    });
  }
}
