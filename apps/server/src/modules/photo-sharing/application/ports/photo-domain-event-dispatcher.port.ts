import type { IDomainEvent } from "@/shared/domain";

export interface IPhotoDomainEventDispatcherPort {
  dispatch(events: IDomainEvent[]): Promise<void>;
}
