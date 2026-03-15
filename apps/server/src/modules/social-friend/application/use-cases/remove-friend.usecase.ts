import { injectable, inject } from "inversify";
import type { IUseCase } from "@/shared/application";
import { SOCIAL_FRIEND_KEY } from "../../di/social-friend.token";
import type { IFriendshipRepository } from "../../domain/repositories/friendship.repository.interface";
import type { RemoveFriendDto } from "../dtos/input/remove-friend.dto";
import { FriendNotFoundError } from "../../domain/errors/social-friend.error";

@injectable()
export class RemoveFriendUseCase implements IUseCase<RemoveFriendDto, void> {
  constructor(
    @inject(SOCIAL_FRIEND_KEY.REPOSITORY)
    private readonly friendshipRepository: IFriendshipRepository,
  ) {}

  async execute(input: RemoveFriendDto): Promise<void> {
    const removed = await this.friendshipRepository.removeAcceptedBetween(
      input.userId,
      input.friendUserId,
    );
    if (!removed) {
      throw new FriendNotFoundError(input.friendUserId);
    }
  }
}
