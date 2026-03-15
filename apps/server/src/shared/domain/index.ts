export type { IDomainEvent } from "./events/domain-event.interface";
export { DomainEvent } from "./events/domain-event.abstract";

export { Entity } from "./entities/entity.abstract";
export type { EntityBaseProps } from "./entities/base-entiy.props";

export {
  AggregateRoot,
  ConcurrencyError,
} from "./aggregates/aggregate-root.abstract";

export { ValueObject } from "./value-objects/value-object.abstract";
