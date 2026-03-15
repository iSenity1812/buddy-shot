import { ContainerModule } from "inversify";
import { HEALTH_TYPES } from "./di/health.token";
import "./presentation/health.controller";
import { HealthIndicator } from "./application/health-indicator.interface";
import { HealthCheckUseCase } from "./application/health-check.usecase";
import { PostgreHealthIndicator } from "./infrastructure/indicators/postgre-health.indicator";

export const healthModule = new ContainerModule((bind) => {
  bind<HealthIndicator>(HEALTH_TYPES.Indicator)
    .to(PostgreHealthIndicator)
    .inSingletonScope();

  bind<HealthCheckUseCase>(HEALTH_TYPES.HealthCheckUseCase)
    .to(HealthCheckUseCase)
    .inSingletonScope();
});
