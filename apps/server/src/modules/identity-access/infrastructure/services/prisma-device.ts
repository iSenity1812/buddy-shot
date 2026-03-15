import { injectable } from "inversify";
import {
  IDeviceService,
  RegisterDeviceInput,
} from "../../domain/services/auth.service.interface";
import { DevicePlatform, PrismaClient } from "@prisma/client";

/**
 * Resolves (upsert) a Device record.
 *
 * Strategy:
 *  - Look up by pushToken first (device may re-register with same token)
 *  - If found and belongs to same user → reactivate + update lastSeenAt
 *  - If not found → create new Device record
 *  - Returns deviceId in all cases
 */
@injectable()
export class PrismaDeviceService implements IDeviceService {
  constructor(private readonly prisma: PrismaClient) {}

  private normalizePlatform(raw: string | undefined): DevicePlatform {
    const upper = raw?.trim().toUpperCase();
    if (upper === DevicePlatform.IOS) return DevicePlatform.IOS;
    if (upper === DevicePlatform.ANDROID) return DevicePlatform.ANDROID;
    return DevicePlatform.DESKTOP;
  }

  async resolveDevice(input: RegisterDeviceInput): Promise<string> {
    const existing = await this.prisma.device.findUnique({
      where: { pushToken: input.pushToken },
    });

    if (existing) {
      // Reactivate and update lastSeenAt
      await this.prisma.device.update({
        where: { id: existing.id },
        data: {
          userId: input.userId, // handle device transfer (re-login on same device)
          isActive: true,
          lastSeenAt: new Date(),
        },
      });
      return existing.id;
    }

    const device = await this.prisma.device.create({
      data: {
        userId: input.userId,
        pushToken: input.pushToken,
        platform: this.normalizePlatform(input.platform),
        isActive: true,
        lastSeenAt: new Date(),
      },
    });

    return device.id;
  }

  async deactivateDevice(deviceId: string): Promise<void> {
    await this.prisma.device.update({
      where: { id: deviceId },
      data: { isActive: false },
    });
  }
}
