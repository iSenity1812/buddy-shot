import { DeviceInfoInputDto } from "./device-info.dto";

export interface RegisterInputDto {
  email: string;
  password: string;
  username: string;
  /** Device info bundled with registration — creates the first device session */
  device: DeviceInfoInputDto;
}
