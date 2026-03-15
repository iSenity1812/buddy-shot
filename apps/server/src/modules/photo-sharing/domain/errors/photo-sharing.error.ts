import { DomainError } from "@/shared/errors/domain-error";
import { ErrorCodes } from "@/shared/errors/error-code";

export class PhotoSharingValidationError extends DomainError {
  constructor(message: string, details?: unknown) {
    super(ErrorCodes.PHOTO_SHARING_VALIDATION_ERROR, message, 400, details);
  }
}

export class PhotoRecipientNotEligibleError extends DomainError {
  constructor(recipientIds: string[]) {
    super(
      ErrorCodes.PHOTO_SHARING_CONFLICT_ERROR,
      "One or more recipients are not eligible friends.",
      409,
      { recipientIds },
    );
  }
}
