import { ValueObject } from "@/shared/domain";
import { ProfileValidationError } from "../errors/profile.error";

interface BioProps {
  value: string;
  [key: string]: unknown;
}

export class Bio extends ValueObject<BioProps> {
  static maxLength = 160;

  private constructor(props: BioProps) {
    super(props);
  }

  protected override validate(_props: BioProps): void {
    if (_props.value.length > Bio.maxLength) {
      throw new ProfileValidationError(
        `Bio cannot exceed ${Bio.maxLength} characters.`,
      );
    }
  }

  static create(value: string): Bio {
    return new Bio({ value });
  }

  static empty(): Bio {
    return new Bio({ value: "" });
  }

  get value(): string {
    return this.props.value;
  }

  get isEmpty(): boolean {
    return this.props.value.trim() === "";
  }

  toString(): string {
    return this.props.value;
  }
}
