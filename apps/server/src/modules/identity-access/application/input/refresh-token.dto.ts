export interface RefreshTokenInputDto {
  /** Raw refresh token from the client (Authorization header or body) */
  rawRefreshToken: string;
  /**
   * Optional device identifier for telemetry/debugging.
   * If provided, the server may use it for best-effort checks,
   * but it is not strictly required for refreshing tokens.
   */
  deviceId?: string;
}
