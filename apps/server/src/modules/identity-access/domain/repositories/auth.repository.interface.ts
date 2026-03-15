import { RefreshToken } from "../entities/refresh-token";
import { User } from "../entities/user";

// ─── IUserRepository ──────────────────────────────────────────────────────────
export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  existsByEmail(email: string): Promise<boolean>;
  existsByUsername(username: string): Promise<boolean>;
  save(user: User): Promise<void>;
}

// ─── IRefreshTokenRepository ──────────────────────────────────────────────────

export interface IRefreshTokenRepository {
  /** Find by token hash — used on rotation to verify incoming token */
  findByTokenHash(tokenHash: string): Promise<RefreshToken | null>;

  /** Find all active (non-revoked, non-expired) tokens for a device */
  findActiveByDeviceId(deviceId: string): Promise<RefreshToken[]>;

  /** Find all active tokens for a user — used for logout-all / reuse detection */
  findActiveByUserId(userId: string): Promise<RefreshToken[]>;

  save(token: RefreshToken): Promise<void>;

  /** Bulk revoke — used on logout-all or reuse detection */
  revokeAllForUser(userId: string): Promise<void>;
  revokeAllForDevice(deviceId: string): Promise<void>;

  /** Cleanup cron: delete expired + revoked tokens older than N days */
  deleteExpiredBefore(date: Date): Promise<number>;
}
