import { injectable, inject } from "inversify";
import type { IUseCase } from "@/shared/application";
import { SOCIAL_FRIEND_KEY } from "../../di/social-friend.token";
import type { IFriendshipRepository } from "../../domain/repositories/friendship.repository.interface";
import { FriendshipDtoMapper } from "../mappers/friendship-dto.mapper";
import type { PendingFriendRequestDto } from "../dtos/output/friend-request.dto";

@injectable()
export class ListOutgoingFriendRequestsUseCase implements IUseCase<
  string,
  PendingFriendRequestDto[]
> {
  constructor(
    @inject(SOCIAL_FRIEND_KEY.REPOSITORY)
    private readonly friendshipRepository: IFriendshipRepository,
  ) {}

  async execute(userId: string): Promise<PendingFriendRequestDto[]> {
    const items = await this.friendshipRepository.listOutgoingPending(userId);
    return items.map(FriendshipDtoMapper.toPendingRequestDto);
  }
}
