import { DomainError } from "@/shared/errors/domain-error";
import { ErrorCodes } from "@/shared/errors/error-code";

export class EmailValidationError extends DomainError {
  constructor(details?: unknown) {
    super(
      ErrorCodes.EMAIL_VALIDATION_ERROR,
      "Invalid email address.",
      409,
      details,
    );
  }
}

export class EmailAlreadyExistsError extends DomainError {
  constructor(details?: unknown) {
    super(
      ErrorCodes.EMAIL_VALIDATION_ERROR,
      "Email is already in use.",
      409,
      details,
    );
  }
}

export class PasswordValidationError extends DomainError {
  constructor(message: string, details?: unknown) {
    super(ErrorCodes.PASSWORD_VALIDATION_ERROR, message, 400, details);
  }
}

export class InvalidPlatformError extends DomainError {
  constructor(message: string, details?: unknown) {
    super(ErrorCodes.IDENTITY_VALIDATION_ERROR, message, 400, details);
  }
}

export class InvalidDeviceInfoError extends DomainError {
  constructor(message: string, details?: unknown) {
    super(ErrorCodes.IDENTITY_VALIDATION_ERROR, message, 400, details);
  }
}

export class InvalidCredentialsError extends DomainError {
  constructor(details?: unknown) {
    super(
      ErrorCodes.INVALID_CREDENTIALS,
      "Invalid email or password.",
      401,
      details,
    );
  }
}

export class TokenRevokedError extends DomainError {
  constructor(message: string, details?: unknown) {
    super(ErrorCodes.TOKEN_REVOKED, message, 401, details);
  }
}

export class UserNotFoundError extends DomainError {
  constructor(details?: unknown) {
    super(ErrorCodes.NOT_FOUND, "User not found.", 404, details);
  }
}

export class TokenReuseDetectedError extends DomainError {
  constructor(details?: unknown) {
    super(
      ErrorCodes.TOKEN_REUSE_DETECTED,
      "Refresh token reuse detected. All tokens for this user have been revoked.",
      401,
      details,
    );
  }
}
