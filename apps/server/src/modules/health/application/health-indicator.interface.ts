import { HealthIndicatorResult } from "./health.type";

export interface HealthIndicator {
  name: string;
  check(): Promise<HealthIndicatorResult>;
}
