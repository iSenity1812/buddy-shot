export type HealthStatus = "up" | "down";

export type HealthIndicatorResult = {
  name: string;
  status: HealthStatus;
  details?: unknown;
};

export type HealthSummary = {
  total: number;
  up: number;
  down: number;
};

export type HealthCheckResult = {
  status: "ok" | "error";
  results: HealthIndicatorResult[];
  summary: HealthSummary;
};
