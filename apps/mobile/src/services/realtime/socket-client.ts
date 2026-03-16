import { io, type Socket } from "socket.io-client";
import { API_BASE_URL } from "../http/axios.config";
import {
  SOCKET_EVENT,
  type PhotoCaptionUpdatedSocketPayload,
  type PhotoDeletedSocketPayload,
  type PhotoReactionUpdatedSocketPayload,
  type PhotoRecipientSocketPayload,
  type ProfileAvatarChangedSocketPayload,
} from "./socket-events";

interface AccessTokenPayload {
  sub?: string;
}

type SocketAuthPayload = {
  token: string;
  userId: string;
};

function resolveSocketBaseUrl(): string {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return API_BASE_URL.replace(/\/api\/v1\/?$/, "");
  }
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");

  if (typeof globalThis.atob === "function") {
    return globalThis.atob(padded);
  }

  throw new Error("Base64 decoder is not available.");
}

function resolveAuthFromAccessToken(token: string): SocketAuthPayload | null {
  const segments = token.split(".");
  if (segments.length < 2) {
    return null;
  }

  try {
    const payload = JSON.parse(
      decodeBase64Url(segments[1]),
    ) as AccessTokenPayload;
    const userId = typeof payload.sub === "string" ? payload.sub.trim() : "";
    if (!userId) {
      return null;
    }

    return {
      token,
      userId,
    };
  } catch {
    return null;
  }
}

class RealtimeSocketClient {
  private readonly baseUrl = resolveSocketBaseUrl();

  private socket?: Socket;

  connectWithAccessToken(token: string): void {
    const authPayload = resolveAuthFromAccessToken(token);
    if (!authPayload) {
      this.disconnect();
      return;
    }

    if (!this.socket) {
      this.socket = io(this.baseUrl, {
        transports: ["websocket"],
        auth: authPayload,
      });
      return;
    }

    this.socket.auth = authPayload;
    if (this.socket.connected) {
      this.socket.disconnect();
    }
    this.socket.connect();
  }

  disconnect(): void {
    if (!this.socket) {
      return;
    }

    this.socket.disconnect();
    this.socket.removeAllListeners();
    this.socket = undefined;
  }

  onPhotoRecipient(
    handler: (payload: PhotoRecipientSocketPayload) => void,
  ): () => void {
    if (!this.socket) {
      return () => undefined;
    }

    this.socket.on(SOCKET_EVENT.PHOTO_RECIPIENT, handler);
    return () => {
      this.socket?.off(SOCKET_EVENT.PHOTO_RECIPIENT, handler);
    };
  }

  onPhotoCaptionUpdated(
    handler: (payload: PhotoCaptionUpdatedSocketPayload) => void,
  ): () => void {
    if (!this.socket) {
      return () => undefined;
    }

    this.socket.on(SOCKET_EVENT.PHOTO_CAPTION_UPDATED, handler);
    return () => {
      this.socket?.off(SOCKET_EVENT.PHOTO_CAPTION_UPDATED, handler);
    };
  }

  onPhotoDeleted(
    handler: (payload: PhotoDeletedSocketPayload) => void,
  ): () => void {
    if (!this.socket) {
      return () => undefined;
    }

    this.socket.on(SOCKET_EVENT.PHOTO_DELETED, handler);
    return () => {
      this.socket?.off(SOCKET_EVENT.PHOTO_DELETED, handler);
    };
  }

  onPhotoReactionUpdated(
    handler: (payload: PhotoReactionUpdatedSocketPayload) => void,
  ): () => void {
    if (!this.socket) {
      return () => undefined;
    }

    this.socket.on(SOCKET_EVENT.PHOTO_REACTION_UPDATED, handler);
    return () => {
      this.socket?.off(SOCKET_EVENT.PHOTO_REACTION_UPDATED, handler);
    };
  }

  onProfileAvatarChanged(
    handler: (payload: ProfileAvatarChangedSocketPayload) => void,
  ): () => void {
    if (!this.socket) {
      return () => undefined;
    }

    this.socket.on(SOCKET_EVENT.PROFILE_AVATAR_CHANGED, handler);
    return () => {
      this.socket?.off(SOCKET_EVENT.PROFILE_AVATAR_CHANGED, handler);
    };
  }
}

export const realtimeSocketClient = new RealtimeSocketClient();
