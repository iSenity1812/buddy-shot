import { IUseCase } from "@/shared/application";
import { inject, injectable } from "inversify";
import { ProfileResponseOutputDto } from "../dtos/output/profile-response.dto";
import type { IProfileRepository } from "../../domain/repositories/profile.repository.interface";
import type { IQrCodePort } from "../ports/qrcode.port";
import { PROFILE_KEY } from "../../di/profile.token";
import { QrCodeResponseOutputDto } from "../dtos/output/qrcode-response.dto";
import { Profile } from "../../domain/entities/profile";

@injectable()
export class GenerateProfileQrCodeUseCase implements IUseCase<
  string, // userId
  QrCodeResponseOutputDto
> {
  private static readonly DEEP_LINK_BASE = "buddyshot://profile/";

  constructor(
    @inject(PROFILE_KEY.REPOSITORY)
    private readonly profileRepository: IProfileRepository,

    @inject(PROFILE_KEY.PORT.QR_CODE)
    private readonly qrCodePort: IQrCodePort, // need to finish implementing this port
  ) {}

  async execute(input: string): Promise<QrCodeResponseOutputDto> {
    const profile = await this.profileRepository.findByUserId(input);
    Profile.assertExists(profile, input);

    const deepLink = `${GenerateProfileQrCodeUseCase.DEEP_LINK_BASE}/${profile.username.value}`;
    const qrCodeBase64 = await this.qrCodePort.generateBase64(deepLink);

    return {
      userId: profile.userId,
      username: profile.username.value,
      qrCodeBase64,
    };
  }
}
