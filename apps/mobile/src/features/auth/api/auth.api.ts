import {
  httpClient,
  setAuthAccessToken,
} from "@/src/services/http/axios.config";
import { AUTH_ENDPOINTS } from "../keys/auth.keys";
import type {
  AuthSession,
  DevicePlatform,
  LoginPayload,
  RegisterPayload,
} from "../types/auth.types";

interface RefreshPayload {
  refreshToken: string;
  deviceId?: string;
}

interface LogoutPayload {
  deviceId?: string;
  allDevices?: boolean;
}

function normalizeDevicePlatform(platform?: DevicePlatform): DevicePlatform {
  if (platform) {
    return platform;
  }

  return "DESKTOP";
}

function applySession(session: AuthSession): AuthSession {
  setAuthAccessToken(session.accessToken);
  return session;
}

export const authApi = {
  async login(payload: LoginPayload): Promise<AuthSession> {
    const session = await httpClient.post<AuthSession, LoginPayload>(
      AUTH_ENDPOINTS.login,
      {
        ...payload,
        device: {
          ...payload.device,
          platform: normalizeDevicePlatform(payload.device?.platform),
        },
      },
    );

    return applySession(session);
  },

  async register(payload: RegisterPayload): Promise<AuthSession> {
    const session = await httpClient.post<AuthSession, RegisterPayload>(
      AUTH_ENDPOINTS.register,
      {
        ...payload,
        device: {
          ...payload.device,
          platform: normalizeDevicePlatform(payload.device?.platform),
        },
      },
    );

    return applySession(session);
  },

  async refresh(payload: RefreshPayload): Promise<AuthSession> {
    const session = await httpClient.post<AuthSession, RefreshPayload>(
      AUTH_ENDPOINTS.refresh,
      payload,
    );

    return applySession(session);
  },

  async logout(payload?: LogoutPayload): Promise<void> {
    await httpClient.post<void, LogoutPayload | undefined>(
      AUTH_ENDPOINTS.logout,
      payload,
    );
    setAuthAccessToken(null);
  },
};
