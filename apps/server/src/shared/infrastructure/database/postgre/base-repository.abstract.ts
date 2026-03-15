import { injectable } from "inversify";
import { Prisma } from "@prisma/client";
import { TransactionalClient } from "./transactional-client";

/**
 * Base class for all Prisma-backed Repository implementations.
 *
 * Feature repositories extend this and use `this.tx` to run all queries.
 * Because `this.tx` comes from TransactionalClient, every query automatically
 * participates in the current UnitOfWork transaction.
 *
 * Example:
 *
 *   @injectable()
 *   export class PrismaUserRepository extends BaseRepository implements IUserRepository {
 *     constructor(@inject(TX_CLIENT) txClient: TransactionalClient) {
 *       super(txClient);
 *     }
 *
 *     async findById(id: UserId): Promise<User | null> {
 *       const row = await this.tx.user.findUnique({ where: { id: id.value } });
 *       return row ? UserMapper.toDomain(row) : null;
 *     }
 *
 *     async save(user: User): Promise<void> {
 *       const data = UserMapper.toPersistence(user);
 *       await this.tx.user.upsert({
 *         where: { id: data.id },
 *         create: data,
 *         update: data,
 *       });
 *     }
 *   }
 *
 * NOTE: Never inject PrismaClient directly into a feature repository.
 *       Always use `this.tx` so operations join the active transaction.
 *       If you need to read outside a transaction (e.g. a query handler
 *       that doesn't need UoW), create a separate ReadRepository that
 *       injects PrismaClient directly.
 */
@injectable()
export abstract class BaseRepository {
  constructor(protected readonly txClient: TransactionalClient) {}

  /**
   * The active Prisma TransactionClient.
   * Typed as Prisma.TransactionClient which omits $transaction, $connect,
   * $disconnect — exactly what you want inside a transaction scope.
   */
  protected get tx(): Prisma.TransactionClient {
    return this.txClient.client;
  }
}
