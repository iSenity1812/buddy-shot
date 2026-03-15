export interface LogoutInputDto {
  userId: string;
  deviceId: string;
  /** If true, revoke all sessions across all devices */
  allDevices?: boolean;
}
