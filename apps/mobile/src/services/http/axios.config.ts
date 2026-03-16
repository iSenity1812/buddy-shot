import Constants from "expo-constants";
import { Platform } from "react-native";

interface ApiErrorPayload {
  code?: string;
  message?: string;
  details?: unknown;
}

interface ApiSuccessResponse<T> {
  success: true;
  data?: T;
  message?: string;
}

interface ApiErrorResponse {
  success: false;
  error?: ApiErrorPayload;
}

type ApiEnvelope<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export class HttpError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(params: {
    message: string;
    status: number;
    code?: string;
    details?: unknown;
  }) {
    super(params.message);
    this.name = "HttpError";
    this.status = params.status;
    this.code = params.code;
    this.details = params.details;
  }
}

function getExpoHost(): string | undefined {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) {
    return undefined;
  }

  return hostUri.split(":")[0];
}

function resolveApiBaseUrl(): string {
  const explicitBase = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (explicitBase) {
    return explicitBase.replace(/\/+$/, "");
  }

  const expoHost = getExpoHost();
  if (expoHost) {
    return `http://${expoHost}:4000/api/v1`;
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:4000/api/v1";
  }

  return "http://localhost:4000/api/v1";
}

const API_BASE_URL = resolveApiBaseUrl();
let authAccessToken: string | null = null;

export function setAuthAccessToken(token: string | null): void {
  authAccessToken = token;
}

function resolveMessage(status: number, payload?: ApiErrorPayload): string {
  if (payload?.message?.trim()) {
    return payload.message;
  }

  if (status === 401) {
    return "You are not authorized. Please login again.";
  }

  if (status >= 500) {
    return "Server is unavailable. Please try again.";
  }

  return "Request failed. Please try again.";
}

async function request<T>(
  path: string,
  init: Omit<RequestInit, "body"> & { body?: unknown } = {},
): Promise<T> {
  const headers = new Headers(init.headers ?? {});
  headers.set("Content-Type", "application/json");

  if (!headers.has("Authorization") && authAccessToken) {
    headers.set("Authorization", `Bearer ${authAccessToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    body:
      init.body === undefined || init.body === null
        ? undefined
        : JSON.stringify(init.body),
  });

  const raw = await response.text();
  let payload: ApiEnvelope<T> | undefined;

  if (raw) {
    try {
      payload = JSON.parse(raw) as ApiEnvelope<T>;
    } catch {
      payload = undefined;
    }
  }

  if (!response.ok || payload?.success === false) {
    const errorPayload =
      payload && payload.success === false ? payload.error : undefined;

    throw new HttpError({
      status: response.status,
      code: errorPayload?.code,
      details: errorPayload?.details,
      message: resolveMessage(response.status, errorPayload),
    });
  }

  return payload?.data as T;
}

export const httpClient = {
  get<T>(path: string, init?: RequestInit): Promise<T> {
    return request<T>(path, { ...init, method: "GET" });
  },
  post<T, TBody = unknown>(
    path: string,
    body?: TBody,
    init?: RequestInit,
  ): Promise<T> {
    return request<T>(path, { ...init, method: "POST", body });
  },
  patch<T, TBody = unknown>(
    path: string,
    body?: TBody,
    init?: RequestInit,
  ): Promise<T> {
    return request<T>(path, { ...init, method: "PATCH", body });
  },
  delete<T>(path: string, init?: RequestInit): Promise<T> {
    return request<T>(path, { ...init, method: "DELETE" });
  },
};
