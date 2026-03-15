export type AuthMode = "login" | "register";

export type DevicePlatform = "IOS" | "ANDROID" | "DESKTOP";

export interface AuthDeviceInfo {
  pushToken?: string;
  deviceId?: string;
  platform?: DevicePlatform;
}

export interface AuthUser {
  id: string;
  email: string;
  username: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresAt: string;
  user: AuthUser;
}

export interface LoginPayload {
  email: string;
  password: string;
  device?: AuthDeviceInfo;
}

export interface RegisterPayload extends LoginPayload {
  username: string;
}
