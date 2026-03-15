import type { IDomainEvent } from "../domain";

/**
 * Contract for publishing domain events to the event bus.
 * Infrastructure layer implements this (e.g. using NestJS EventEmitter, RabbitMQ, Kafka).
 *
 * Only publish events AFTER the transaction has committed successfully.
 * Typically called from Unit of Work or Application Service.
 */
export interface IEventBus {
  /**
   * Publish a single domain event.
   */
  publish<T extends IDomainEvent>(event: T): Promise<void>;

  /**
   * Publish multiple domain events in order.
   * Prefer this over calling publish() in a loop — implementations can batch internally.
   */
  publishAll(events: IDomainEvent[]): Promise<void>;
}
