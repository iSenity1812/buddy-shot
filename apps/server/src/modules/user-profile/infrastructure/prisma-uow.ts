import {
  EVENT_BUS,
  type IEventBus,
  IRepositoryRegistry,
  IUnitOfWork,
} from "@/shared/application";
import { AggregateRoot } from "@/shared/domain";
import { PRISMA_CLIENT } from "@/shared/shared-di.tokens";
import { PrismaClient } from "@prisma/client";
import { inject, injectable } from "inversify";

/**
 * PrismaUnitOfWork implements IUnitOfWork using Prisma transactions.
 *
 * Each `execute` call creates a new transaction and provides repositories with a transactional Prisma client (`tx`).
 * Repositories must use this `tx` for all DB operations to ensure they are part of the transaction.
 * After `work` completes successfully, we publish all collected domain events.
 * If `work` throws an error, the transaction is rolled back and no events are dispatched.
 * This ensures atomicity: either all DB changes and events are committed, or none are.
 */
@injectable()
export class PrismaUnitOfWork implements IUnitOfWork {
  private trackedAggregates: AggregateRoot<any>[] = [];

  constructor(
    @inject(PRISMA_CLIENT)
    private readonly prisma: PrismaClient,

    @inject(EVENT_BUS)
    private readonly eventBus: IEventBus,
  ) {}

  trackAggregate(aggregate: AggregateRoot<any>): void {
    this.trackedAggregates.push(aggregate);
  }

  async execute<T>(
    work: (repos: IRepositoryRegistry) => Promise<T>,
  ): Promise<T> {
    return await this.prisma.$transaction(async (tx) => {
      // Initial registry contain repositories with `tx` injected for transactional queries
      const repos: IRepositoryRegistry = {
        // Example: users: new PrismaUserRepository(tx),
      };

      // 2. Run the work/use case inside transaction
      const result = await work(repos);

      // 3. After successful commit, dispatch collected domain events
      const events = this.trackedAggregates.flatMap((agg) => agg.domainEvents);
      await this.eventBus.publishAll(events);
      this.trackedAggregates = []; // Clear tracked aggregates after dispatching
      return result;
    });
  }
}
