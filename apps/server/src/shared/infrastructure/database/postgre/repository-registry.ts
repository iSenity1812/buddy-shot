import { Prisma } from "@prisma/client";
import { IRepositoryRegistry } from "../../../application";

type RepoFactory<T> = (tx: Prisma.TransactionClient) => T;

/**
 * A registry that holds factory functions, not instances.
 *
 * Each module registers a factory once at startup (via ContainerModule).
 * When execute() runs, repos are created lazily — only when accessed,
 * and only once per transaction (cached on first access).
 *
 * This means:
 *  - No upfront instantiation of repos you never use
 *  - Each module is self-contained — registers its own factory
 *  - PrismaUnitOfWork doesn't need to know about any concrete repo class
 */
export class RepositoryRegistry {
  private readonly _factories = new Map<string, RepoFactory<unknown>>();

  // ------------------------------------------------------------------ register
  /**
   * Called once at startup by each module's ContainerModule.
   *
   * @example
   * // inside user.module.ts ContainerModule:
   * registry.register("users", (tx) => new PrismaUserRepository(tx));
   */
  register<K extends keyof IRepositoryRegistry>(
    key: K,
    factory: RepoFactory<IRepositoryRegistry[K]>,
  ): void {
    if (this._factories.has(key)) {
      throw new Error(
        `[RepositoryRegistry] Key "${key}" is already registered`,
      );
    }
    this._factories.set(key, factory as RepoFactory<unknown>);
  }

  // ------------------------------------------------------------------ build
  /**
   * Called by PrismaUnitOfWork at the start of each execute().
   * Returns a Proxy that lazily instantiates repos on first access
   * and caches them for the duration of the transaction.
   */
  build(tx: Prisma.TransactionClient): IRepositoryRegistry {
    const cache = new Map<string, unknown>();
    const factories = this._factories;

    return new Proxy({} as IRepositoryRegistry, {
      get(_target, key: string) {
        if (cache.has(key)) {
          return cache.get(key);
        }

        const factory = factories.get(key);
        if (!factory) {
          throw new Error(
            `[RepositoryRegistry] No factory registered for key "${key}". ` +
              `Did you forget to call registry.register("${key}", ...) in your ContainerModule?`,
          );
        }

        const instance = factory(tx);
        cache.set(key, instance);
        return instance;
      },
    });
  }
}
