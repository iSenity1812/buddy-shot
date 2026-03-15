import { injectable } from "inversify";
import {
  AccessTokenPayload,
  ITokenService,
} from "../../domain/services/auth.service.interface";
import { randomBytes } from "crypto";
import jwt from "jsonwebtoken";
import { envConfig } from "@/shared/config/env.config";

@injectable()
export class JwtTokenService implements ITokenService {
  private readonly accessSecret: string;
  private readonly accessExpiresIn: number; // seconds (e.g. 900 = 15 min)
  private readonly refreshTTLSeconds: number; // e.g. 30 days

  constructor() {
    this.accessSecret = envConfig.jwtSecret;
    this.accessExpiresIn = this.parseDurationToSeconds(
      envConfig.jwtAccessExpiresIn,
      15 * 60,
    );
    this.refreshTTLSeconds = this.parseDurationToSeconds(
      envConfig.jwtRefreshExpiresIn,
      7 * 24 * 60 * 60,
    );

    if (!this.accessSecret) throw new Error("JWT_ACCESS_SECRET is not set");
  }

  signAccessToken(payload: AccessTokenPayload): string {
    return jwt.sign(
      {
        sub: payload.sub,
        deviceId: payload.deviceId,
        username: payload.username,
      },
      this.accessSecret,
      { expiresIn: this.accessExpiresIn },
    );
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    const decoded = jwt.verify(token, this.accessSecret) as AccessTokenPayload;
    return decoded;
  }

  generateRawRefreshToken(): string {
    return randomBytes(64).toString("hex"); // 128-char hex string
  }

  getAccessTokenTTLSeconds(): number {
    return this.accessExpiresIn;
  }

  getRefreshTokenTTLSeconds(): number {
    return this.refreshTTLSeconds;
  }

  private parseDurationToSeconds(
    raw: string | undefined,
    fallback: number,
  ): number {
    if (!raw) {
      return fallback;
    }

    const numeric = Number(raw);
    if (!Number.isNaN(numeric) && Number.isFinite(numeric)) {
      return Math.max(1, Math.floor(numeric));
    }

    const normalized = raw.trim().toLowerCase();
    const match = normalized.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(`Invalid duration format: ${raw}`);
    }

    const value = Number(match[1]);
    const unit = match[2];

    switch (unit) {
      case "s":
        return value;
      case "m":
        return value * 60;
      case "h":
        return value * 60 * 60;
      case "d":
        return value * 24 * 60 * 60;
      default:
        throw new Error(`Unsupported duration unit: ${unit}`);
    }
  }
}
