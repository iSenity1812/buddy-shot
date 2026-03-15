import { AppError } from "./error";
import { ErrorCode } from "./error-code";

/**
 * Separate domain-specific errors from generic application errors.
 * This allows us to handle them differently in the error middleware and provide more meaningful responses to clients.
 * If you have specific error scenarios in your application, you can create custom error classes that extend DomainError.
 *
 */
export class DomainError extends AppError {
  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number,
    details?: unknown,
  ) {
    super(code, message, statusCode, details);
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = "You do not have permission to perform this action") {
    super("FORBIDDEN", message, 403);
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = "Authentication required") {
    super("UNAUTHORIZED", message, 401);
  }
}
