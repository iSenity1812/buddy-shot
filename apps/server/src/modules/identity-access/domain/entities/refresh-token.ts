// ─── Aggregate ────────────────────────────────────────────────────────────────

import { AggregateRoot } from "@/shared/domain";
import {
  CreateRefreshTokenInput,
  RefreshTokenProps,
} from "./refresh-token.props";
import { TokenRevokedError } from "../errors/identity.error";

/**
 * RefreshToken Aggregate
 *
 * Lifecycle:
 *  1. Created on login / token refresh
 *  2. Consumed (rotated) on next refresh → old token revoked, new one created
 *  3. Revoked on logout or suspicious reuse detection
 *
 * Security model:
 *  - Raw token is generated in application layer (crypto.randomBytes)
 *  - Only the bcrypt hash is persisted here
 *  - On refresh: hash incoming token → compare via bcrypt → rotate
 */
export class RefreshToken extends AggregateRoot<RefreshTokenProps> {
  private constructor(props: RefreshTokenProps) {
    super(props);
  }

  static create(input: CreateRefreshTokenInput): RefreshToken {
    const now = new Date();
    return new RefreshToken({
      ...AggregateRoot.createBaseProps(),
      userId: input.userId,
      deviceId: input.deviceId,
      tokenHash: input.tokenHash,
      isRevoked: false,
      expiresAt: input.expiresAt,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: RefreshTokenProps): RefreshToken {
    return new RefreshToken(props);
  }

  // ─── Commands ───────────────────────────────────────────────────────────────

  /**
   * Revoke this token.
   * Called when:
   *  - Token is consumed (rotation) — old token is revoked
   *  - User logs out
   *  - Suspicious reuse detected (reuse of already-revoked token)
   */
  revoke(): void {
    (this.props as RefreshTokenProps).isRevoked = true;
    this.incrementVersion();
  }

  /**
   * Guard: assert token is usable before doing anything with it.
   */
  assertValid(): void {
    if (this.props.isRevoked) {
      throw new TokenRevokedError("Refresh token has been revoked");
    }
    if (new Date() > this.props.expiresAt) {
      throw new TokenRevokedError("Refresh token has expired");
    }
  }

  // ─── Getters ────────────────────────────────────────────────────────────────

  get userId(): string {
    return this.props.userId;
  }
  get deviceId(): string {
    return this.props.deviceId;
  }
  get tokenHash(): string {
    return this.props.tokenHash;
  }
  get isRevoked(): boolean {
    return this.props.isRevoked;
  }
  get expiresAt(): Date {
    return this.props.expiresAt;
  }
  get isExpired(): boolean {
    return new Date() > this.props.expiresAt;
  }
}
