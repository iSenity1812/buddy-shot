import { ValueObject } from "@/shared/domain";
import { ProfileValidationError } from "../errors/profile.error";

interface UsernameProps {
  value: string;
  [key: string]: unknown;
}

/**
 * Username Value Object
 * Rules: 3–30 chars, alphanumeric + underscore, no leading/trailing underscore
 */
export class Username extends ValueObject<UsernameProps> {
  private static readonly REGEX = /^[a-z0-9][a-z0-9_]{1,28}[a-z0-9]$/;
  static readonly MIN_LENGTH = 3;
  static readonly MAX_LENGTH = 30;

  private constructor(props: UsernameProps) {
    super(props);
  }

  protected override validate(props: UsernameProps): void {
    const v = props.value;
    if (
      !v ||
      v.length < Username.MIN_LENGTH ||
      v.length > Username.MAX_LENGTH
    ) {
      throw new ProfileValidationError(
        `Username must be between ${Username.MIN_LENGTH} and ${Username.MAX_LENGTH} characters.`,
        { value: v },
      );
    }

    if (!Username.REGEX.test(v)) {
      throw new ProfileValidationError(
        "Username can only contain lowercase letters, numbers, and underscores. It cannot start or end with an underscore.",
        { value: v },
      );
    }
  }

  static create(value: string): Username {
    return new Username({ value });
  }

  get value(): string {
    return this.props.value;
  }

  toString(): string {
    return this.props.value;
  }
}
