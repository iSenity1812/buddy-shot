import { DomainError } from "@/shared/errors/domain-error";
import { ErrorCodes } from "@/shared/errors/error-code";

export class ProfileValidationError extends DomainError {
  constructor(message: string, details?: unknown) {
    super(ErrorCodes.PROFILE_VALIDATION_ERROR, message, 400, details);
  }
}

export class ProfileNotFoundException extends DomainError {
  constructor(profileId: string) {
    super(
      ErrorCodes.PROFILE_VALIDATION_ERROR,
      `Profile with ID ${profileId} not found.`,
      404,
      { profileId },
    );
  }
}

export class AvatarUploadError extends DomainError {
  constructor(message: string, details?: unknown) {
    super(ErrorCodes.AVATAR_UPLOAD_ERROR, message, 500, details);
  }
}

export class UsernameAlreadyExistsError extends DomainError {
  constructor(username: string) {
    super(
      ErrorCodes.USERNAME_ALREADY_EXISTS,
      `Username "${username}" is already taken.`,
      400,
      { username },
    );
  }
}
