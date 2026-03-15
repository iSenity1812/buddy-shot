import type { IEventBus } from "./event-bus.interface";
import type { AggregateRoot, EntityBaseProps } from "../domain";

/**
 * Unit of Work coordinates:
 *  1. A single database transaction across one or more repositories.
 *  2. Collecting domain events from all touched aggregates.
 *  3. Dispatching those events AFTER the transaction commits.
 *
 * Usage pattern:
 *
 *   await this.uow.execute(async (repos) => {
 *     const user = await repos.users.findById(id);
 *     user.changeEmail(newEmail);
 *     await repos.users.save(user);
 *   });
 */
export interface IUnitOfWork {
  /**
   * Run `work` inside a transaction.
   * On success  → commit → dispatch collected domain events.
   * On failure  → rollback → rethrow error (no events dispatched).
   */
  execute<T>(work: (repos: IRepositoryRegistry) => Promise<T>): Promise<T>;

  /**
   * Collect domain events from an aggregate so they are dispatched after commit.
   * Call this inside `work` after mutating the aggregate.
   */
  trackAggregate(aggregate: AggregateRoot<EntityBaseProps>): void;
}

/**
 * Registry of repositories provided to the `work` callback.
 * Each module extends this interface and registers its own repos.
 *
 * @example
 * declare module "../../shared/application/unit-of-work.interface" {
 *   interface IRepositoryRegistry {
 *     users: IUserRepository;
 *     orders: IOrderRepository;
 *   }
 * }
 */
export interface IRepositoryRegistry {}
