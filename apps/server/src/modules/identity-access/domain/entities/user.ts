// ─── Aggregate Root ───────────────────────────────────────────────────────────

import { AggregateRoot } from "@/shared/domain";
import { UserProps } from "./user.props";
import { CreateUserInput } from "./input/create-user.input";
import { UserRegisteredEvent } from "../events/user-registered.event";
import { Email } from "../value-objects/email.vo";
import { HashedPassword } from "../value-objects/hashed-password.vo";
import { ReconstitueUserInput } from "./input/reconstitue-user.input";
import { UserDeactivatedEvent } from "../events/user-deactivated.event";
import { InvalidCredentialsError } from "../errors/identity.error";

/**
 * User Aggregate Root — Identity & Access bounded context.
 *
 * Owns: email, passwordHash, isActive status.
 * Does NOT own: avatarKey, bio, username display — that belongs to user-profile.
 *
 * Note: username is stored here as the unique constraint is on users table,
 * but it is managed/validated by the user-profile module after creation.
 */
export class User extends AggregateRoot<UserProps> {
  private constructor(props: UserProps) {
    super(props);
  }

  static create(input: CreateUserInput): User {
    const now = new Date();
    const user = new User({
      id: input.userId,
      email: Email.create(input.email),
      passwordHash: HashedPassword.fromHash(input.passwordHash),
      username: input.username,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      version: 0,
    });

    user.addEvent(
      new UserRegisteredEvent(user.id, user.version, {
        email: user.email.value,
        username: user.username,
      }),
    );
    return user;
  }

  static reconstitute(input: ReconstitueUserInput): User {
    return new User({
      id: input.id,
      email: Email.create(input.email),
      passwordHash: HashedPassword.fromHash(input.passwordHash),
      username: input.username,
      isActive: input.isActive,
      createdAt: input.createdAt,
      updatedAt: input.updatedAt,
      version: input.version,
    });
  }

  // ─── Commands ───────────────────────────────────────────────────────────────

  /**
   * Verifies the user can log in.
   * Throws if account is deactivated.
   */
  assertCanLogin(): void {
    if (!this.props.isActive) {
      throw new InvalidCredentialsError("Account is deactivated");
    }
  }

  changePassword(newHash: HashedPassword): void {
    (this.props as UserProps).passwordHash = newHash;
    this.incrementVersion();
  }

  deactivate(): void {
    if (!this.props.isActive) return;
    (this.props as UserProps).isActive = false;
    this.incrementVersion();
    this.addEvent(new UserDeactivatedEvent(this.id, this.version));
  }

  // ─── Getters ────────────────────────────────────────────────────────────────

  get email(): Email {
    return this.props.email;
  }
  get passwordHash(): HashedPassword {
    return this.props.passwordHash;
  }
  get username(): string {
    return this.props.username;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
}
