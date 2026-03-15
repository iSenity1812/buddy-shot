export interface IDomainEvent {
  readonly eventId: string;
  readonly eventName: string;
  readonly aggregateId: string;
  readonly aggregateType: string; /*eg: User, Order  */
  readonly aggregateVersion: number;
  readonly occurredAt: Date;
  readonly metadata?: Record<string, unknown>;
}
