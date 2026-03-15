import { ValueObject } from "@/shared/domain";
import { ProfileValidationError } from "../errors/profile.error";

interface AvatarKeyProps {
  value: string;
  [key: string]: unknown;
}

/**
 * AvatarKey Value Object
 * Represents the Cloudflare R2 object key for a user's avatar.
 * Format: "avatars/<uuid>.jpg" or "avatars/<uuid>.webp"
 *
 * We store the key, NOT the full URL.
 * The CDN base URL is resolved at the presentation layer.
 */
export class AvatarKey extends ValueObject<AvatarKeyProps> {
  private static readonly REGEX =
    /^avatars\/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$/i;

  private constructor(props: AvatarKeyProps) {
    super(props);
  }

  protected override validate(props: AvatarKeyProps): void {
    if (!AvatarKey.REGEX.test(props.value)) {
      throw new ProfileValidationError(
        "Invalid avatar key format. Expected: avatars/<uuid>.(jpg|jpeg|png|webp)",
        { value: props.value },
      );
    }
  }

  static create(value: string): AvatarKey {
    return new AvatarKey({ value });
  }

  get value(): string {
    return this.props.value;
  }

  toString(): string {
    return this.props.value;
  }
}
