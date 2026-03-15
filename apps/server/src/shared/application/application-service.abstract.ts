import type { IEventBus } from "./event-bus.interface";
import type { AggregateRoot, EntityBaseProps } from "../domain";

/**
 * Optional base class for Application Services that need to dispatch
 * domain events collected from aggregates WITHOUT a Unit of Work.
 *
 * Prefer IUnitOfWork for transactional flows.
 * Use this for simple, non-transactional scenarios (e.g. read-side, CQRS query side).
 */
export abstract class ApplicationService {
  constructor(protected readonly eventBus: IEventBus) {}

  /**
   * Dispatch all uncommitted events from one or more aggregates,
   * then clear them on the aggregate.
   */
  protected async dispatchEvents(
    ...aggregates: AggregateRoot<EntityBaseProps>[]
  ): Promise<void> {
    const events = aggregates.flatMap((agg) => agg.domainEvents);
    if (events.length > 0) {
      await this.eventBus.publishAll(events);
    }
  }
}
