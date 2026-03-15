import { IUseCase } from "@/shared/application";
import { inject, injectable } from "inversify";
import { UpdateProfileInputDto } from "../dtos/input/update-profile.dto";
import { ProfileResponseOutputDto } from "../dtos/output/profile-response.dto";
import type { IProfileRepository } from "../../domain/repositories/profile.repository.interface";
import type { IStoragePort } from "../ports/storage.port";
import { PROFILE_KEY } from "../../di/profile.token";
import { Profile } from "../../domain/entities/profile";
import { UsernameAlreadyExistsError } from "../../domain/errors/profile.error";
import { ProfileDtoMapper } from "../mappers/profile-dto.mapper";

@injectable()
export class UpdateProfileUseCase implements IUseCase<
  UpdateProfileInputDto,
  ProfileResponseOutputDto
> {
  constructor(
    @inject(PROFILE_KEY.REPOSITORY)
    private readonly profileRepository: IProfileRepository,

    @inject(PROFILE_KEY.PORT.STORAGE)
    private readonly storagePort: IStoragePort,
  ) {}

  async execute(
    input: UpdateProfileInputDto,
  ): Promise<ProfileResponseOutputDto> {
    const profile = await this.profileRepository.findByUserId(input.userId);
    Profile.assertExists(profile, input.userId);

    if (input.username && input.username !== profile.username.value) {
      // Check if new username is taken by another user
      const existing = await this.profileRepository.findByUsername(
        input.username,
      );
      if (existing && existing.userId !== input.userId) {
        throw new UsernameAlreadyExistsError(input.username);
      }
    }

    profile.updateProfile(input);
    await this.profileRepository.save(profile);
    return ProfileDtoMapper.toResponse(profile, this.storagePort);
  }
}
