import { DomainError } from "@/shared/errors/domain-error";
import { ErrorCodes } from "@/shared/errors/error-code";

export class SocialFriendValidationError extends DomainError {
  constructor(message: string, details?: unknown) {
    super(ErrorCodes.SOCIAL_FRIEND_VALIDATION_ERROR, message, 400, details);
  }
}

export class FriendRequestNotFoundError extends DomainError {
  constructor(friendshipId: string) {
    super(
      ErrorCodes.NOT_FOUND,
      `Friend request with id ${friendshipId} was not found.`,
      404,
      { friendshipId },
    );
  }
}

export class FriendshipAlreadyExistsError extends DomainError {
  constructor(message = "Friendship already exists.", details?: unknown) {
    super(ErrorCodes.SOCIAL_FRIEND_CONFLICT_ERROR, message, 409, details);
  }
}

export class FriendRequestAlreadyHandledError extends DomainError {
  constructor(friendshipId: string) {
    super(
      ErrorCodes.SOCIAL_FRIEND_CONFLICT_ERROR,
      "Friend request was already handled.",
      409,
      { friendshipId },
    );
  }
}

export class NotFriendRequestParticipantError extends DomainError {
  constructor(friendshipId: string, userId: string) {
    super(
      ErrorCodes.FORBIDDEN,
      "You are not allowed to modify this friend request.",
      403,
      { friendshipId, userId },
    );
  }
}

export class FriendNotFoundError extends DomainError {
  constructor(userId: string) {
    super(ErrorCodes.NOT_FOUND, "Friendship does not exist.", 404, { userId });
  }
}
