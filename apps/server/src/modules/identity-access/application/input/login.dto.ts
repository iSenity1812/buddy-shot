import { DeviceInfoInputDto } from "./device-info.dto";

export interface LoginInputDto {
  email: string;
  password: string;
  device: DeviceInfoInputDto;
}
