import { User as PrismaUser } from "@prisma/client";
import { Profile } from "../../domain/entities/profile";
/**
 * Mapper: converts between Prisma DB record and Profile domain aggregate.
 *
 * NOTE: We read Profile data from the `users` table directly
 * (username, bio, avatarKey are columns on the User model).
 * There is no separate `profiles` table in this schema.
 */
export class ProfileMapper {
  /**
   * DB record → Domain aggregate (for read operations)
   * Does NOT raise domain events.
   */
  static toDomain(record: PrismaUser): Profile {
    return Profile.reconstitute({
      id: record.id,
      userId: record.id, // Profile ID is the same as User ID
      username: record.username,
      bio: record.bio ?? null,
      avatarKey: record.avatarKey ?? null,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      version: record.version,
      isActive: record.isActive,
    });
  }

  static toPersistence(
    profile: Profile,
  ): Pick<
    PrismaUser,
    "username" | "bio" | "avatarKey" | "updatedAt" | "version" | "isActive"
  > {
    return {
      username: profile.username.value,
      bio: profile.bio.isEmpty ? null : profile.bio.value,
      avatarKey: profile.avatarKey?.value ?? null,
      updatedAt: profile.updatedAt,
      version: profile.version,
      isActive: profile.isActive,
    };
  }
}
