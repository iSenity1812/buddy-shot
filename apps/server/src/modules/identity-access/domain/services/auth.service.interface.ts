import { HashedPassword } from "../value-objects/hashed-password.vo";
import { PlainPassword } from "../value-objects/plain-passowrd.vo";

// ─── IPasswordHasher ──────────────────────────────────────────────────────────

/**
 * Port for password hashing (bcrypt).
 * Kept out of domain entities so the hashing algorithm is swappable.
 */
export interface IPasswordHasher {
  hash(plain: PlainPassword): Promise<HashedPassword>;
  compare(plain: PlainPassword, hashed: HashedPassword): Promise<boolean>;
}

// ─── ITokenService ────────────────────────────────────────────────────────────

export interface AccessTokenPayload {
  sub: string; // userId
  deviceId: string;
  username: string;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string; // raw — sent to client, hash stored in DB
  accessTokenExpiresIn: number; // seconds
  refreshTokenExpiresAt: Date;
}

/**
 * Port for JWT signing / verification.
 * Implementation uses jsonwebtoken library.
 */
export interface ITokenService {
  /** Sign a new access token (short-lived, e.g. 15 min) */
  signAccessToken(payload: AccessTokenPayload): string;

  /** Verify and decode access token — throws if invalid/expired */
  verifyAccessToken(token: string): AccessTokenPayload;

  /** Generate cryptographically random refresh token (raw bytes as hex) */
  generateRawRefreshToken(): string;

  /** Access token lifetime in seconds */
  getAccessTokenTTLSeconds(): number;

  /** How long refresh tokens live */
  getRefreshTokenTTLSeconds(): number;
}

// ─── IDeviceService ───────────────────────────────────────────────────────────

export interface RegisterDeviceInput {
  userId: string;
  pushToken: string;
  platform?: string;
}

/**
 * Port for device registration/lookup.
 * Resolves or creates the Device record, returns deviceId.
 */
export interface IDeviceService {
  resolveDevice(input: RegisterDeviceInput): Promise<string>; // returns deviceId
  deactivateDevice(deviceId: string): Promise<void>;
}

export const DEVICE_SERVICE = Symbol("IDeviceService");
