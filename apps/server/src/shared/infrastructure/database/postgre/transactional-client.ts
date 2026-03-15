import { Prisma } from "@prisma/client";

/**
 * Wraps a Prisma.TransactionClient scoped to a single interactive transaction.
 *
 * Prisma's interactive transaction passes a `tx` object (TransactionClient)
 * inside the $transaction() callback. This wrapper captures that `tx` so
 * repositories can use it without needing to be inside the callback directly.
 *
 * Lifecycle (managed by PrismaUnitOfWork):
 *   1. UnitOfWork.begin() resolves a Promise that gives us the `tx`
 *   2. Repositories call .client to run queries on the same transaction
 *   3. UnitOfWork.commit() resolves the outer promise → Prisma commits
 *   4. UnitOfWork.rollback() rejects the outer promise → Prisma rolls back
 *
 * NOTE: Unlike pg's PoolClient, you do NOT call release() manually.
 *       Prisma handles the connection lifecycle inside $transaction().
 */
export class TransactionalClient {
  private _client: Prisma.TransactionClient | null = null;

  // ------------------------------------------------------------------ bind
  /**
   * Attach the TransactionClient received inside $transaction(async tx => ...).
   * Called once by PrismaUnitOfWork — not by application code.
   */
  bind(client: Prisma.TransactionClient): void {
    if (this._client) {
      throw new Error("[TransactionalClient] Already has an active tx client");
    }
    this._client = client;
  }

  // ------------------------------------------------------------------ reset
  /**
   * Clear the reference after the transaction completes.
   * Called by PrismaUnitOfWork after commit / rollback.
   */
  reset(): void {
    this._client = null;
  }

  // ------------------------------------------------------------------ client
  /**
   * The Prisma TransactionClient. Use this inside Repository implementations.
   * Throws if no transaction is currently active.
   */
  get client(): Prisma.TransactionClient {
    if (!this._client) {
      throw new Error(
        "[TransactionalClient] No active transaction. Did you call UnitOfWork.begin()?",
      );
    }
    return this._client;
  }

  // ------------------------------------------------------------------ state
  get isActive(): boolean {
    return this._client !== null;
  }
}
