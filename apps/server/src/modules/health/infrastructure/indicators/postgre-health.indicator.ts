import { PrismaClient } from "@prisma/client";
import { inject, injectable } from "inversify";
import { HealthIndicator } from "../../application/health-indicator.interface";
import { HealthIndicatorResult } from "../../application/health.type";
import { PRISMA_CLIENT } from "@/shared/shared-di.tokens";

@injectable()
export class PostgreHealthIndicator implements HealthIndicator {
  readonly name = "postgresql";

  constructor(
    @inject(PRISMA_CLIENT) private readonly prismaClient: PrismaClient,
  ) {}

  async check(): Promise<HealthIndicatorResult> {
    const startedAt = Date.now();

    try {
      await this.prismaClient.$queryRawUnsafe("SELECT 1");

      return {
        name: this.name,
        status: "up",
        details: {
          reachable: true,
          latencyMs: Date.now() - startedAt,
        },
      };
    } catch (error) {
      return {
        name: this.name,
        status: "down",
        details: {
          reachable: false,
          latencyMs: Date.now() - startedAt,
          error:
            error instanceof Error
              ? {
                  message: error.message,
                  name: error.name,
                }
              : {
                  message: "Unknown database error",
                },
        },
      };
    }
  }
}
