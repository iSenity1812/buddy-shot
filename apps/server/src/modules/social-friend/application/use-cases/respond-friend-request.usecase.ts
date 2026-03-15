import { injectable, inject } from "inversify";
import type { IUseCase } from "@/shared/application";
import { FriendshipStatus } from "@prisma/client";
import { SOCIAL_FRIEND_KEY } from "../../di/social-friend.token";
import type { IFriendshipRepository } from "../../domain/repositories/friendship.repository.interface";
import type { RespondFriendRequestDto } from "../dtos/input/respond-friend-request.dto";
import type { FriendRequestDto } from "../dtos/output/friend-request.dto";
import {
  FriendRequestAlreadyHandledError,
  FriendRequestNotFoundError,
  SocialFriendValidationError,
} from "../../domain/errors/social-friend.error";
import { FriendshipDtoMapper } from "../mappers/friendship-dto.mapper";

@injectable()
export class RespondFriendRequestUseCase implements IUseCase<
  RespondFriendRequestDto,
  FriendRequestDto | null
> {
  constructor(
    @inject(SOCIAL_FRIEND_KEY.REPOSITORY)
    private readonly friendshipRepository: IFriendshipRepository,
  ) {}

  async execute(
    input: RespondFriendRequestDto,
  ): Promise<FriendRequestDto | null> {
    if (input.action !== "accept" && input.action !== "reject") {
      throw new SocialFriendValidationError(
        "action must be either 'accept' or 'reject'.",
      );
    }

    const friendship = await this.friendshipRepository.findById(
      input.friendshipId,
    );
    if (!friendship) {
      throw new FriendRequestNotFoundError(input.friendshipId);
    }

    if (friendship.status !== FriendshipStatus.PENDING) {
      throw new FriendRequestAlreadyHandledError(input.friendshipId);
    }

    if (input.action === "accept") {
      friendship.accept(input.actorId);
      await this.friendshipRepository.save(friendship);
      return FriendshipDtoMapper.toFriendRequestDto(friendship);
    }

    friendship.assertCanRespond(input.actorId);
    await this.friendshipRepository.deleteById(friendship.id);
    return null;
  }
}
