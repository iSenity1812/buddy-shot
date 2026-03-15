import { RefreshToken } from "../../domain/entities/refresh-token";
import { RefreshToken as PrismaRefreshToken } from "@prisma/client";

export class RefreshTokenMapper {
  static toDomain(record: PrismaRefreshToken): RefreshToken {
    return RefreshToken.reconstitute({
      id: record.id,
      userId: record.userId,
      deviceId: record.deviceId,
      tokenHash: record.tokenHash,
      isRevoked: record.isRevoked,
      expiresAt: record.expiresAt,
      createdAt: record.createdAt,
      updatedAt: record.createdAt,
      version: 0, // Prisma doesn't have a built-in version field, so we can default to 0 or manage it separately
    });
  }

  static toPersistence(token: RefreshToken) {
    return {
      id: token.id,
      userId: token.userId,
      deviceId: token.deviceId,
      tokenHash: token.tokenHash,
      isRevoked: token.isRevoked,
      expiresAt: token.expiresAt,
    };
  }
}
