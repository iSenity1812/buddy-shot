import { Profile } from "../../domain/entities/profile";
import { ProfileResponseOutputDto } from "../dtos/output/profile-response.dto";
import { IStoragePort } from "../ports/storage.port";

export class ProfileDtoMapper {
  static toResponse(
    profile: Profile,
    storage: IStoragePort,
  ): ProfileResponseOutputDto {
    return {
      userId: profile.userId,
      username: profile.username.value,
      bio: profile.bio.value,
      avatarUrl: profile.avatarKey
        ? storage.getPublicUrl(profile.avatarKey.value)
        : null,
      updatedAt: profile.updatedAt.toISOString(),
    };
  }
}
