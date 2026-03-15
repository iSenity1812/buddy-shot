import { User as PrismaUser } from "@prisma/client";
import { User } from "../../domain/entities/user";

export class UserMapper {
  static toDomain(record: PrismaUser): User {
    return User.reconstitute({
      id: record.id,
      email: record.email,
      passwordHash: record.passwordHash,
      username: record.username,
      isActive: record.isActive,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      version: record.version,
    });
  }

  static toPersistence(user: User): Omit<PrismaUser, "avatarKey" | "bio"> {
    return {
      id: user.id,
      email: user.email.value,
      passwordHash: user.passwordHash.value,
      username: user.username,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      version: user.version,
    };
  }
}
