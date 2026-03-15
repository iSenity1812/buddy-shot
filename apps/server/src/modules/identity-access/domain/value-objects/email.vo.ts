import { ValueObject } from "@/shared/domain";
import { EmailValidationError } from "../errors/identity.error";

interface EmailProps {
  value: string;
  [key: string]: unknown;
}

export class Email extends ValueObject<EmailProps> {
  private static readonly REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  private constructor(props: EmailProps) {
    super(props);
  }

  protected override validate(props: EmailProps): void {
    if (!props.value || !Email.REGEX.test(props.value)) {
      throw new EmailValidationError({ value: props.value });
    }
  }

  static create(raw: string): Email {
    return new Email({ value: raw.toLowerCase().trim() });
  }

  get value(): string {
    return this.props.value;
  }
  toString(): string {
    return this.props.value;
  }
}
