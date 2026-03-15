import { inject, injectable } from "inversify";
import { Prisma, PrismaClient } from "@prisma/client";
import { TransactionalClient } from "./transactional-client";
import {
  type IUnitOfWork,
  type IRepositoryRegistry,
  type IEventBus,
} from "../../../application";
import { AggregateRoot, EntityBaseProps } from "../../../domain";
import { EVENT_BUS, PRISMA_CLIENT } from "../../../shared-di.tokens";

/**
 * How `execute()` works under the hood:
 *
 *   prisma.$transaction(async (tx) => {
 *     const repos = this.buildRegistry(tx);   ← repos backed by tx
 *     const result = await work(repos);        ← user code runs here
 *     await dispatchEvents();                  ← after work, before commit
 *     return result;
 *   })                                         ← Prisma commits on return
 *                                              ← Prisma rolls back on throw
 *
 * Domain events are dispatched INSIDE the $transaction callback,
 * after `work` succeeds but before Prisma commits.
 * If event dispatch throws, the whole transaction rolls back — consistent.
 *
 * If you prefer events dispatched AFTER commit (eventual consistency),
 * move _dispatchDomainEvents() outside the $transaction call (see comment below).
 */
@injectable()
export class PrismaUnitOfWork implements IUnitOfWork {
  private _aggregates: AggregateRoot<EntityBaseProps>[] = [];

  constructor(
    @inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
    @inject(EVENT_BUS) private readonly eventBus: IEventBus,
  ) {}

  // ------------------------------------------------------------------ execute
  async execute<T>(
    work: (repos: IRepositoryRegistry) => Promise<T>,
  ): Promise<T> {
    // Reset aggregate tracking for this execution
    this._aggregates = [];

    const result = await this.prisma.$transaction(
      async (tx) => {
        // Build the registry with repos that all share the same `tx`
        const repos = this._buildRegistry(tx);

        // Run user-supplied work
        const workResult = await work(repos);

        // ── Option A (default): dispatch events INSIDE the transaction.
        // If any event handler throws, the whole tx rolls back.
        // Use this when event handlers write to the same DB.
        await this._dispatchDomainEvents();

        return workResult;
      },
      {
        maxWait: Number(process.env.DB_TX_MAX_WAIT ?? 5_000),
        timeout: Number(process.env.DB_TX_TIMEOUT ?? 15_000),
      },
    );

    // ── Option B: dispatch events OUTSIDE (after commit).
    // Uncomment this block and remove _dispatchDomainEvents() from above
    // if your event handlers are out-of-process (Redis, SQS, etc.)
    // and you want fire-and-forget after commit.
    //
    // await this._dispatchDomainEvents();

    return result;
  }

  // ------------------------------------------------------------------ trackAggregate
  trackAggregate(aggregate: AggregateRoot<EntityBaseProps>): void {
    if (!this._aggregates.includes(aggregate)) {
      this._aggregates.push(aggregate);
    }
  }

  // ------------------------------------------------------------------ private
  /**
   * Build the IRepositoryRegistry with every repo backed by `tx`.
   *
   * Each module that augments IRepositoryRegistry must have its concrete
   * repository class listed here.
   *
   * @example
   * // modules/user/infrastructure/user.registry.ts augments this method
   * // by overriding _buildRegistry in a subclass, OR simply add here:
   *
   *   users: new PrismaUserRepository(tx),
   *   orders: new PrismaOrderRepository(tx),
   */
  protected _buildRegistry(tx: Prisma.TransactionClient): IRepositoryRegistry {
    // Base returns an empty object — concrete app wires this up.
    // See "Wiring" section in the comment below.
    return {} as IRepositoryRegistry;
  }

  private async _dispatchDomainEvents(): Promise<void> {
    for (const aggregate of this._aggregates) {
      for (const event of aggregate.pullDomainEvents()) {
        await this.eventBus.publish(event);
      }
    }
  }
}
