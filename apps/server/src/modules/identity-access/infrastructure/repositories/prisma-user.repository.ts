import { injectable } from "inversify";
import { IUserRepository } from "../../domain/repositories/auth.repository.interface";
import { PrismaClient } from "@prisma/client";
import type { IEventBus } from "@/shared/application";
import { ConcurrencyError } from "@/shared/domain";
import { UserMapper } from "../mappers/user.mapper";
import { User } from "../../domain/entities/user";

@injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly eventBus: IEventBus,
  ) {}

  async findById(id: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({ where: { id } });
    return record ? UserMapper.toDomain(record) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    return record ? UserMapper.toDomain(record) : null;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { email: email.toLowerCase() },
    });
    return count > 0;
  }

  async existsByUsername(username: string): Promise<boolean> {
    const count = await this.prisma.user.count({ where: { username } });
    return count > 0;
  }

  async save(user: User): Promise<void> {
    const data = UserMapper.toPersistence(user);

    // Upsert: INSERT on first save, UPDATE with version check on subsequent saves
    if (user.version === 0) {
      await this.prisma.user.create({
        data: { ...data, avatarKey: null, bio: null },
      });
    } else {
      try {
        await this.prisma.user.update({
          where: { id: user.id, version: user.version - 1 },
          data,
        });
      } catch (err: any) {
        if (err?.code === "P2025") {
          const current = await this.prisma.user.findUnique({
            where: { id: user.id },
            select: { version: true },
          });
          throw new ConcurrencyError(
            "User",
            user.id,
            user.version - 1,
            current?.version ?? -1,
          );
        }
        throw err;
      }
    }

    if (user.hasPendingEvents()) {
      await this.eventBus.publishAll(user.pullDomainEvents());
    }
  }
}
