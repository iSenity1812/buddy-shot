import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { envConfig } from "@/shared/config/env.config";

function buildDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const username = encodeURIComponent(envConfig.db.username);
  const password = encodeURIComponent(envConfig.db.password);

  return `postgresql://${username}:${password}@${envConfig.db.host}:${envConfig.db.port}/${envConfig.db.database}`;
}

/**
 * Creates a singleton PrismaClient.
 * Bind with: bind<PrismaClient>(PRISMA_CLIENT).toConstantValue(createPrismaClient())
 *
 * Prisma manages its own connection pool internally — do NOT call
 * prisma.$disconnect() except during graceful shutdown in main.ts.
 */
export function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: buildDatabaseUrl(),
    max: envConfig.db.pool.max,
    idleTimeoutMillis: envConfig.db.pool.idleTimeoutMillis,
    connectionTimeoutMillis: envConfig.db.pool.connectionTimeoutMillis,
  });

  const prisma = new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["warn", "error"],
  });

  // Graceful shutdown — release connections on SIGINT / SIGTERM
  const shutdown = async () => {
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  return prisma;
}
