import { IUseCase } from "@/shared/application";
import { ProfileResponseOutputDto } from "../dtos/output/profile-response.dto";
import { GetProfileDto } from "../dtos/input/get-profile.dto";
import type { IProfileRepository } from "../../domain/repositories/profile.repository.interface";
import type { IStoragePort } from "../ports/storage.port";
import { injectable, inject } from "inversify";
import { PROFILE_KEY } from "../../di/profile.token";
import { Profile } from "../../domain/entities/profile";
import { ProfileValidationError } from "../../domain/errors/profile.error";
import { ProfileDtoMapper } from "../mappers/profile-dto.mapper";

@injectable()
export class GetProfileUseCase implements IUseCase<
  GetProfileDto,
  ProfileResponseOutputDto
> {
  constructor(
    @inject(PROFILE_KEY.REPOSITORY)
    private readonly profileRepository: IProfileRepository,

    @inject(PROFILE_KEY.PORT.STORAGE)
    private readonly storagePort: IStoragePort,
  ) {}

  async execute(input: GetProfileDto): Promise<ProfileResponseOutputDto> {
    let profile: Profile | null = null;

    if (input.userId) {
      profile = await this.profileRepository.findByUserId(input.userId);
    } else if (input.username) {
      profile = await this.profileRepository.findByUsername(input.username);
    } else {
      throw new ProfileValidationError(
        "Either userId or username must be provided",
      );
    }

    Profile.assertExists(profile, input.userId ?? input.username ?? "unknown");
    return ProfileDtoMapper.toResponse(profile, this.storagePort);
  }
}
