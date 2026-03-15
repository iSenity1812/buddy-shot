import { IUseCase } from "@/shared/application";
import { inject, injectable } from "inversify";
import { LogoutInputDto } from "../input/logout.dto";
import { IDENTITY_KEY } from "../../di/identity.token";
import type { IDeviceService } from "../../domain/services/auth.service.interface";
import type { IRefreshTokenRepository } from "../../domain/repositories/auth.repository.interface";

@injectable()
export class LogoutUseCase implements IUseCase<LogoutInputDto, void> {
  constructor(
    @inject(IDENTITY_KEY.DOMAIN_SERVICE.DEVICE)
    private readonly deviceService: IDeviceService,

    @inject(IDENTITY_KEY.REPOSITORY.REFRESH_TOKEN)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(input: LogoutInputDto): Promise<void> {
    if (input.allDevices) {
      await this.refreshTokenRepository.revokeAllForUser(input.userId);
    } else {
      await this.refreshTokenRepository.revokeAllForDevice(input.deviceId);
      await this.deviceService.deactivateDevice(input.deviceId);
    }
  }
}
