import { injectable, multiInject } from "inversify";
import { IUseCase } from "../../../shared/application";
import { HealthCheckResult, HealthIndicatorResult } from "./health.type";
import { HealthIndicator } from "./health-indicator.interface";
import { HEALTH_TYPES } from "../di/health.token";

@injectable()
export class HealthCheckUseCase implements IUseCase<void, HealthCheckResult> {
  constructor(
    @multiInject(HEALTH_TYPES.Indicator)
    private readonly indicators: HealthIndicator[],
  ) {}

  async execute(): Promise<HealthCheckResult> {
    const results = await Promise.all(
      this.indicators.map(async (indicator): Promise<HealthIndicatorResult> => {
        try {
          return await indicator.check();
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown indicator error";

          return {
            name: indicator.name,
            status: "down",
            details: {
              error: message,
            },
          };
        }
      }),
    );

    const up = results.filter((result) => result.status === "up").length;
    const down = results.length - up;

    return {
      status: down === 0 ? "ok" : "error",
      results,
      summary: {
        total: results.length,
        up,
        down,
      },
    };
  }
}
