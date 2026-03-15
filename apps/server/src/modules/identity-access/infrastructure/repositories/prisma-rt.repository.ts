import { injectable } from "inversify";
import { IRefreshTokenRepository } from "../../domain/repositories/auth.repository.interface";
import { PrismaClient } from "@prisma/client";
import { RefreshToken } from "../../domain/entities/refresh-token";
import { RefreshTokenMapper } from "../mappers/refresh-token.mapper";

@injectable()
export class PrismaRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
    return record ? RefreshTokenMapper.toDomain(record) : null;
  }

  async findActiveByDeviceId(deviceId: string): Promise<RefreshToken[]> {
    const records = await this.prisma.refreshToken.findMany({
      where: { deviceId, isRevoked: false, expiresAt: { gt: new Date() } },
    });
    return records.map(RefreshTokenMapper.toDomain);
  }

  async findActiveByUserId(userId: string): Promise<RefreshToken[]> {
    const records = await this.prisma.refreshToken.findMany({
      where: { userId, isRevoked: false, expiresAt: { gt: new Date() } },
    });
    return records.map(RefreshTokenMapper.toDomain);
  }

  async save(token: RefreshToken): Promise<void> {
    const data = RefreshTokenMapper.toPersistence(token);
    await this.prisma.refreshToken.upsert({
      where: { id: token.id },
      create: data,
      update: { isRevoked: data.isRevoked },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  async revokeAllForDevice(deviceId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { deviceId, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  async deleteExpiredBefore(date: Date): Promise<number> {
    const result = await this.prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: date }, isRevoked: true },
    });
    return result.count;
  }
}
