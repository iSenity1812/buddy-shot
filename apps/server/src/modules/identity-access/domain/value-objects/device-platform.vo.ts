import { ValueObject } from "@/shared/domain";
import { InvalidPlatformError } from "../errors/identity.error";

export enum DevicePlatform {
  IOS = "IOS",
  ANDROID = "ANDROID",
  DESKTOP = "DESKTOP",
}

interface DevicePlatformVoProps {
  value: DevicePlatform;
  [key: string]: unknown;
}

export class DevicePlatformVo extends ValueObject<DevicePlatformVoProps> {
  private constructor(props: DevicePlatformVoProps) {
    super(props);
  }

  static create(raw: string): DevicePlatformVo {
    const upper = raw?.toUpperCase();
    if (
      upper !== DevicePlatform.IOS &&
      upper !== DevicePlatform.ANDROID &&
      upper !== DevicePlatform.DESKTOP
    ) {
      throw new InvalidPlatformError(
        `Invalid platform: "${raw}". Must be IOS, ANDROID, or DESKTOP`,
      );
    }
    return new DevicePlatformVo({ value: upper as DevicePlatform });
  }

  get value(): DevicePlatform {
    return this.props.value;
  }
  toString(): string {
    return this.props.value;
  }
}
