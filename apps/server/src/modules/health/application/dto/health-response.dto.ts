import { HealthStatus } from "../health.type";

export interface HealthIndicatorResponse {
  name: string;
  status: HealthStatus;
  working: boolean;
  details?: unknown;
}

export interface HealthCheckResponse {
  status: "ok" | "error";
  summary: {
    total: number;
    up: number;
    down: number;
  };
  indicators: HealthIndicatorResponse[];
}
