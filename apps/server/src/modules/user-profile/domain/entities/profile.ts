import { AggregateRoot } from "@/shared/domain";
import { ProfileProps } from "./profile.props";
import { CreateProfileInput } from "./input/create-profile.input";
import { Username } from "../value-objects/username.vo";
import { Bio } from "../value-objects/bio.vo";
import { AvatarKey } from "../value-objects/avatar.vo";
import { ReconstitueProfileInput } from "./input/reconstitue-profile.profile";
import { UpdateProfileInput } from "./input/user-profile.input";
import { ProfileUpdatedEvent } from "../events/profile-update.event";
import { AvatarChangedEvent } from "../events/avatar-change.event";
import { ProfileNotFoundException } from "../errors/profile.error";

/**
 * Profile Aggregate Root
 *
 * Represents the public-facing identity of a user:
 * username, bio, and avatar.
 *
 * NOTE: Profile.id === User.id (same UUID, different aggregate context).
 * This is a deliberate design — Profile is a projection of the identity,
 * scoped to the user-profile bounded context.
 */
export class Profile extends AggregateRoot<ProfileProps> {
  private constructor(props: ProfileProps) {
    super(props);
  }

  // ─── Factory: create (new user signs up) ─────────────────────────────────────
  static create(input: CreateProfileInput): Profile {
    const now = new Date();
    const profile = new Profile({
      id: input.userId, // Profile ID is the same as User ID
      userId: input.userId,
      username: Username.create(input.username),
      bio: input.bio ? Bio.create(input.bio) : Bio.empty(),
      avatarKey: input.avatarKey ? AvatarKey.create(input.avatarKey) : null,
      createdAt: now,
      updatedAt: now,
      version: 0,
      isActive: true,
    });

    return profile;
  }

  // ─── Factory: reconstitute (load from DB — no events raised) ─────────────────
  static reconstitute(props: ReconstitueProfileInput): Profile {
    return new Profile({
      id: props.id,
      userId: props.userId,
      username: Username.create(props.username),
      bio: props.bio ? Bio.create(props.bio) : Bio.empty(),
      avatarKey: props.avatarKey ? AvatarKey.create(props.avatarKey) : null,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
      version: props.version,
      isActive: props.isActive,
    });
  }

  // ─── Commands ────────────────────────────────────────────────────────────────

  /**
   * Update username and/or bio.
   * Raises ProfileUpdatedEvent for downstream modules (feed, social).
   */
  updateProfile(input: UpdateProfileInput): void {
    let changed = false;

    if (input.username !== undefined) {
      const newUsername = Username.create(input.username);
      if (!newUsername.equals(this.props.username)) {
        (this.props as ProfileProps).username = newUsername;
        changed = true;
      }
    }

    if (input.bio !== undefined) {
      const newBio = input.bio === null ? Bio.empty() : Bio.create(input.bio);
      if (!newBio.equals(this.props.bio)) {
        (this.props as ProfileProps).bio = newBio;
        changed = true;
      }
    }

    if (!changed) return;

    this.incrementVersion();
    this.addEvent(
      new ProfileUpdatedEvent(this.id, this.version, {
        username: this.props.username.value,
        bio: this.props.bio.value,
      }),
    );
  }

  /**
   * Change or remove the avatar.
   * Raises AvatarChangedEvent (Media Storage listens → delete old R2 object).
   */
  changeAvatar(newAvatarKey: string | null): void {
    const oldKey = this.props.avatarKey?.value ?? null;
    const newKey = newAvatarKey ? AvatarKey.create(newAvatarKey) : null;

    (this.props as ProfileProps).avatarKey = newKey;
    this.incrementVersion();

    this.addEvent(
      new AvatarChangedEvent(this.id, this.version, {
        oldAvatarKey: oldKey,
        newAvatarKey: newAvatarKey,
      }),
    );
  }

  // ─── Getters ─────────────────────────────────────────────────────────────────
  get userId(): string {
    return this.props.userId;
  }

  get username(): Username {
    return this.props.username;
  }

  get bio(): Bio {
    return this.props.bio;
  }

  get avatarKey(): AvatarKey | null {
    return this.props.avatarKey;
  }

  get hasAvatar(): boolean {
    return this.props.avatarKey !== null;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  // ─── Guard ───────────────────────────────────────────────────────────────────

  static assertExists(
    profile: Profile | null,
    userId: string,
  ): asserts profile is Profile {
    if (!profile) throw new ProfileNotFoundException(userId);
  }
}
