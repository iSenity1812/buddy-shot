import { injectable, inject } from "inversify";
import type { IUseCase } from "@/shared/application";
import { SOCIAL_FRIEND_KEY } from "../../di/social-friend.token";
import type { IFriendshipRepository } from "../../domain/repositories/friendship.repository.interface";
import type { SearchUsersDto } from "../dtos/input/search-users.dto";
import type { SearchUserDto } from "../dtos/output/search-user.dto";
import { FriendshipDtoMapper } from "../mappers/friendship-dto.mapper";
import { SocialFriendValidationError } from "../../domain/errors/social-friend.error";

@injectable()
export class SearchUsersUseCase implements IUseCase<
  SearchUsersDto,
  SearchUserDto[]
> {
  constructor(
    @inject(SOCIAL_FRIEND_KEY.REPOSITORY)
    private readonly friendshipRepository: IFriendshipRepository,
  ) {}

  async execute(input: SearchUsersDto): Promise<SearchUserDto[]> {
    const normalized = input.username?.trim().toLowerCase();
    if (!normalized) {
      throw new SocialFriendValidationError("username query is required.");
    }

    const limit = this.clampLimit(input.limit ?? 20);
    const users = await this.friendshipRepository.searchUsersByUsername(
      input.userId,
      normalized,
      limit,
    );
    return users.map(FriendshipDtoMapper.toSearchUserDto);
  }

  private clampLimit(limit: number): number {
    if (!Number.isFinite(limit)) {
      return 20;
    }

    return Math.max(1, Math.min(Math.floor(limit), 50));
  }
}
