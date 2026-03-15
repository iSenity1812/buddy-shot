import { injectable, inject } from "inversify";
import type { IUseCase } from "@/shared/application";
import { SOCIAL_FRIEND_KEY } from "../../di/social-friend.token";
import type { IFriendshipRepository } from "../../domain/repositories/friendship.repository.interface";
import type { SendFriendRequestDto } from "../dtos/input/send-friend-request.dto";
import type { FriendRequestDto } from "../dtos/output/friend-request.dto";
import { FriendshipDtoMapper } from "../mappers/friendship-dto.mapper";
import { Friendship } from "../../domain/entities/friendship";
import { FriendshipStatus } from "@prisma/client";
import { FriendshipAlreadyExistsError } from "../../domain/errors/social-friend.error";

@injectable()
export class SendFriendRequestUseCase implements IUseCase<
  SendFriendRequestDto,
  FriendRequestDto
> {
  constructor(
    @inject(SOCIAL_FRIEND_KEY.REPOSITORY)
    private readonly friendshipRepository: IFriendshipRepository,
  ) {}

  async execute(input: SendFriendRequestDto): Promise<FriendRequestDto> {
    const existing = await this.friendshipRepository.findBetweenUsers(
      input.requesterId,
      input.addresseeId,
    );

    if (existing) {
      if (existing.status === FriendshipStatus.ACCEPTED) {
        throw new FriendshipAlreadyExistsError("Users are already friends.");
      }

      if (existing.requesterId === input.requesterId) {
        throw new FriendshipAlreadyExistsError(
          "Friend request was already sent.",
        );
      }

      existing.accept(input.requesterId);
      await this.friendshipRepository.save(existing);
      return FriendshipDtoMapper.toFriendRequestDto(existing);
    }

    const friendship = Friendship.create(input);
    await this.friendshipRepository.save(friendship);
    return FriendshipDtoMapper.toFriendRequestDto(friendship);
  }
}
