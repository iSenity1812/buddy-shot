import type { NextFunction, Request, Response } from "express";
import { inject } from "inversify";
import { controller, httpGet } from "inversify-express-utils";
import { HealthCheckUseCase } from "../application/health-check.usecase";
import { fail, ok } from "../../../shared/http/builder/response.factory";
import { ErrorCodes } from "../../../shared/errors/error-code";
import { HealthCheckResponse } from "../application/dto/health-response.dto";
import { HEALTH_TYPES } from "../di/health.token";

@controller("/health")
export class HealthController {
  constructor(
    @inject(HEALTH_TYPES.HealthCheckUseCase)
    private readonly healthCheckUseCase: HealthCheckUseCase,
  ) {}

  @httpGet("/")
  async getHealth(
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const result = await this.healthCheckUseCase.execute();

      const responseData: HealthCheckResponse = {
        status: result.status,
        summary: result.summary,
        indicators: result.results.map((indicator) => ({
          name: indicator.name,
          status: indicator.status,
          working: indicator.status === "up",
          details: indicator.details,
        })),
      };

      if (result.status === "ok") {
        return res.status(200).json(
          ok(responseData, {
            message: "All health indicators are operational.",
          }),
        );
      }

      return res.status(503).json(
        fail(
          {
            code: ErrorCodes.SERVICE_UNAVAILABLE,
            message: "One or more health indicators are failing.",
            details: responseData,
          },
          {
            meta: {
              indicatorsDown: result.summary.down,
            },
          },
        ),
      );
    } catch (error) {
      next(error);
    }
  }
}
