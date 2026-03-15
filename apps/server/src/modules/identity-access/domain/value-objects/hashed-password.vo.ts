import { ValueObject } from "@/shared/domain";
import { PasswordValidationError } from "../errors/identity.error";

// Wraps the bcrypt hash stored in DB — constructed by PasswordHasher service
interface HashedPasswordProps {
  value: string;
  [key: string]: unknown;
}

export class HashedPassword extends ValueObject<HashedPasswordProps> {
  private constructor(props: HashedPasswordProps) {
    super(props);
  }

  /** Called by PasswordHasherService after hashing */
  static fromHash(hash: string): HashedPassword {
    if (!hash?.startsWith("$2"))
      throw new PasswordValidationError("Invalid bcrypt hash", { hash });
    return new HashedPassword({ value: hash });
  }

  get value(): string {
    return this.props.value;
  }
}
