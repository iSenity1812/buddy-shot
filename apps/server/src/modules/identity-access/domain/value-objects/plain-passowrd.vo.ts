// Wraps raw password — used only during register/login, never persisted

import { ValueObject } from "@/shared/domain";
import { PasswordValidationError } from "../errors/identity.error";

interface PlainPasswordProps {
  value: string;
  [key: string]: unknown;
}

export class PlainPassword extends ValueObject<PlainPasswordProps> {
  static readonly MIN_LENGTH = 8;
  static readonly MAX_LENGTH = 72; // bcrypt hard limit

  private constructor(props: PlainPasswordProps) {
    super(props);
  }

  protected override validate(props: PlainPasswordProps): void {
    if (
      !props.value ||
      props.value.length < PlainPassword.MIN_LENGTH ||
      props.value.length > PlainPassword.MAX_LENGTH
    ) {
      throw new PasswordValidationError(
        `Password must be ${PlainPassword.MIN_LENGTH}–${PlainPassword.MAX_LENGTH} characters`,
        { value: props.value },
      );
    }
  }

  static create(raw: string): PlainPassword {
    return new PlainPassword({ value: raw });
  }

  get value(): string {
    return this.props.value;
  }
}
