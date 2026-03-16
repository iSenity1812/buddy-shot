import { IUseCase } from "@/shared/application";
import { inject, injectable } from "inversify";
import { ProfileResponseOutputDto } from "../dtos/output/profile-response.dto";
import type { IProfileRepository } from "../../domain/repositories/profile.repository.interface";
import type { IStoragePort } from "../ports/storage.port";
import { PROFILE_KEY } from "../../di/profile.token";
import { Profile } from "../../domain/entities/profile";
import { ProfileDtoMapper } from "../mappers/profile-dto.mapper";
import { ChangeAvatarInputDto } from "../dtos/input/change-avatar.dto";
import type { IProfileRealtimePort } from "../ports/profile-realtime.port";

@injectable()
export class ChangeAvatarUseCase implements IUseCase<
  ChangeAvatarInputDto,
  ProfileResponseOutputDto
> {
  constructor(
    @inject(PROFILE_KEY.REPOSITORY)
    private readonly profileRepository: IProfileRepository,

    @inject(PROFILE_KEY.PORT.STORAGE)
    private readonly storagePort: IStoragePort,

    @inject(PROFILE_KEY.PORT.REALTIME)
    private readonly realtime: IProfileRealtimePort,
  ) {}

  /**
   * Called AFTER the client has uploaded the new image to R2.
   * We just record the new key and raise AvatarChangedEvent
   * (Media Storage module will delete the old R2 object via event).
   */

  async execute(
    input: ChangeAvatarInputDto,
  ): Promise<ProfileResponseOutputDto> {
    const profile = await this.profileRepository.findByUserId(input.userId);
    Profile.assertExists(profile, input.userId);

    profile.changeAvatar(input.avatarKey);
    await this.profileRepository.save(profile);

    const avatarUrl = profile.avatarKey
      ? this.storagePort.getPublicUrl(profile.avatarKey.value)
      : null;

    await this.realtime.notifyAvatarChanged({
      userId: profile.userId,
      username: profile.username.value,
      avatarUrl,
    });

    return ProfileDtoMapper.toResponse(profile, this.storagePort);
  }
}
