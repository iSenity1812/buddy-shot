import { randomUUID } from "crypto";
import { IDomainEvent } from "./domain-event.interface";
/**
 * Abstract base class for all Domain Events.
 *
 * Sử dụng:
 * ```ts
 * export class UserRegisteredEvent extends DomainEvent {
 *   constructor(
 *     aggregateId: string,
 *     aggregateVersion: number,
 *     public readonly email: string,
 *     public readonly username: string,
 *   ) {
 *     super({
 *       eventName: 'UserRegistered',
 *       aggregateId,
 *       aggregateType: 'User',
 *       aggregateVersion,
 *     });
 *   }
 * }
 * ```
 */

export abstract class DomainEvent implements IDomainEvent {
  readonly eventId: string;
  readonly eventName: string;
  readonly aggregateId: string;
  readonly aggregateType: string;
  readonly aggregateVersion: number;
  readonly occurredAt: Date;
  readonly metadata?: Record<string, unknown>;

  protected constructor(props: {
    eventName: string;
    aggregateId: string;
    aggregateType: string;
    aggregateVersion: number;
    metadata?: Record<string, unknown>;
  }) {
    this.eventId = randomUUID();
    this.eventName = props.eventName;
    this.aggregateId = props.aggregateId;
    this.aggregateType = props.aggregateType;
    this.aggregateVersion = props.aggregateVersion;
    this.occurredAt = new Date();
    this.metadata = props.metadata;
  }
}
