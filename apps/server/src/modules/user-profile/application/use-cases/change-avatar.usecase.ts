import { IUseCase } from "@/shared/application";
import { inject, injectable } from "inversify";
import { ProfileResponseOutputDto } from "../dtos/output/profile-response.dto";
import type { IProfileRepository } from "../../domain/repositories/profile.repository.interface";
import type { IStoragePort } from "../ports/storage.port";
import { PROFILE_KEY } from "../../di/profile.token";
import { Profile } from "../../domain/entities/profile";
import { ProfileDtoMapper } from "../mappers/profile-dto.mapper";
import { ChangeAvatarInputDto } from "../dtos/input/change-avatar.dto";

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

    return ProfileDtoMapper.toResponse(profile, this.storagePort);
  }
}
