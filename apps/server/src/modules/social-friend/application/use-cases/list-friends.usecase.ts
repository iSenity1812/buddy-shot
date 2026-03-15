import { injectable, inject } from "inversify";
import type { IUseCase } from "@/shared/application";
import { SOCIAL_FRIEND_KEY } from "../../di/social-friend.token";
import type { IFriendshipRepository } from "../../domain/repositories/friendship.repository.interface";
import { FriendshipDtoMapper } from "../mappers/friendship-dto.mapper";
import type { FriendUserDto } from "../dtos/output/friend-user.dto";

@injectable()
export class ListFriendsUseCase implements IUseCase<string, FriendUserDto[]> {
  constructor(
    @inject(SOCIAL_FRIEND_KEY.REPOSITORY)
    private readonly friendshipRepository: IFriendshipRepository,
  ) {}

  async execute(userId: string): Promise<FriendUserDto[]> {
    const friends = await this.friendshipRepository.listFriends(userId);
    return friends.map(FriendshipDtoMapper.toFriendUserDto);
  }
}
