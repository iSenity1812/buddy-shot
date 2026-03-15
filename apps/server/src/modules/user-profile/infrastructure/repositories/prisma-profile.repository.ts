import { PrismaClient } from "@prisma/client";
import { IProfileRepository } from "../../domain/repositories/profile.repository.interface";
import type { IEventBus } from "@/shared/application";
import { Profile } from "../../domain/entities/profile";
import { ProfileMapper } from "../mappers/profile.mapper";
import { ConcurrencyError } from "@/shared/domain/aggregates/aggregate-root.abstract";
import { injectable } from "inversify";

/**
 * Prisma implementation of IProfileRepository.
 *
 * Profile data lives in the `users` table — no separate profiles table.
 * We scope queries to only the fields Profile aggregate owns.
 */
@injectable()
export class PrismaProfileRepository implements IProfileRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly eventBus: IEventBus,
  ) {}

  async findByUserId(userId: string): Promise<Profile | null> {
    const record = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!record) return null;
    return ProfileMapper.toDomain(record);
  }

  async findByUsername(username: string): Promise<Profile | null> {
    const record = await this.prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });
    if (!record) return null;
    return ProfileMapper.toDomain(record);
  }

  async save(profile: Profile): Promise<void> {
    const data = ProfileMapper.toPersistence(profile);

    try {
      await this.prisma.user.update({
        where: {
          id: profile.id,
          // Optimistic locking: only update if version matches DB
          // Prisma doesn't support compound where on update natively,
          // so we check manually below if this throws P2025
          version: profile.version - 1,
        },
        data,
      });
    } catch (err: any) {
      // P2025 = Record not found (version mismatch or deleted)
      if (err?.code === "P2025") {
        const current = await this.prisma.user.findUnique({
          where: { id: profile.userId },
          select: { version: true },
        });
        throw new ConcurrencyError(
          "Profile",
          profile.userId,
          profile.version - 1,
          current?.version ?? -1,
        );
      }
      throw err;
    }

    // Dispatch domain events AFTER successful DB write
    if (profile.hasPendingEvents()) {
      await this.eventBus.publishAll(profile.pullDomainEvents());
    }
  }
}
