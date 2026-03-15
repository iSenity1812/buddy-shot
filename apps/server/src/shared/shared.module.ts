import { ContainerModule } from "inversify";
import { createPrismaClient } from "./infrastructure/database/postgre/prisma.provider";
import { PrismaClient } from "@prisma/client";
import { PrismaUnitOfWork } from "./infrastructure/database/postgre/prisma.uow";
import { IEventBus, IUnitOfWork } from "./application";
import { RepositoryRegistry } from "./infrastructure/database/postgre/repository-registry";
import {
  EVENT_BUS,
  PRISMA_CLIENT,
  REPOSITORY_REGISTRY,
  UNIT_OF_WORK,
} from "./shared-di.tokens";

export const sharedModule = new ContainerModule((bind) => {
  const noopEventBus: IEventBus = {
    publish: async () => undefined,
    publishAll: async () => undefined,
  };

  // Prisma — singleton, one pool for the whole app
  bind<PrismaClient>(PRISMA_CLIENT).toConstantValue(createPrismaClient());

  // RepositoryRegistry — singleton so all modules register into the same instance
  bind<RepositoryRegistry>(REPOSITORY_REGISTRY)
    .to(RepositoryRegistry)
    .inSingletonScope();

  // UnitOfWork — transient: each use-case call gets its own UoW + clean aggregate list
  bind<IUnitOfWork>(UNIT_OF_WORK).to(PrismaUnitOfWork).inTransientScope();

  // Event bus default implementation (replace with real bus later)
  bind<IEventBus>(EVENT_BUS).toConstantValue(noopEventBus);
});
