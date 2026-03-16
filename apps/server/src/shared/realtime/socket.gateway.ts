import type { Server as HttpServer } from "http";
import { Server as SocketIOServer, type Socket } from "socket.io";
import { envConfig } from "@/shared/config/env.config";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { SOCKET_EVENT, type SocketReadyPayload } from "./socket-events";

class SocketGateway {
  private io?: SocketIOServer;

  init(server: HttpServer): void {
    if (this.io) {
      return;
    }

    this.io = new SocketIOServer(server, {
      cors: {
        origin: envConfig.corsOrigin,
        methods: ["GET", "POST"],
      },
    });

    this.io.use((socket, next) => {
      const authResult = this.verifySocketAuth(socket);
      if (!authResult.ok) {
        next(new Error(authResult.reason));
        return;
      }

      socket.data.userId = authResult.userId;
      next();
    });

    this.io.on("connection", (socket) => {
      const userId = this.getAuthenticatedUserId(socket);
      if (!userId) {
        socket.disconnect(true);
        return;
      }

      socket.join(this.getUserRoom(userId));
      const payload: SocketReadyPayload = { userId };
      socket.emit(SOCKET_EVENT.READY, payload);
    });
  }

  emitToUser(userId: string, eventName: string, payload: unknown): void {
    if (!this.io) {
      return;
    }

    this.io.to(this.getUserRoom(userId)).emit(eventName, payload);
  }

  private getUserRoom(userId: string): string {
    return `user:${userId}`;
  }

  private getAuthenticatedUserId(socket: Socket): string | null {
    const userId = socket.data.userId;
    if (typeof userId === "string" && userId.trim()) {
      return userId.trim();
    }

    return null;
  }

  private verifySocketAuth(
    socket: Socket,
  ): { ok: true; userId: string } | { ok: false; reason: string } {
    const authToken = socket.handshake.auth?.token;
    if (typeof authToken !== "string" || !authToken.trim()) {
      return { ok: false, reason: "Missing access token" };
    }

    const token = authToken.startsWith("Bearer ")
      ? authToken.slice(7).trim()
      : authToken.trim();

    if (!token) {
      return { ok: false, reason: "Missing access token" };
    }

    try {
      const decoded = jwt.verify(token, envConfig.jwtSecret) as JwtPayload;
      const tokenSub =
        typeof decoded.sub === "string" ? decoded.sub.trim() : "";
      if (!tokenSub) {
        return { ok: false, reason: "Invalid token subject" };
      }

      const claimedUserId = socket.handshake.auth?.userId;
      if (
        typeof claimedUserId === "string" &&
        claimedUserId.trim() &&
        claimedUserId.trim() !== tokenSub
      ) {
        return { ok: false, reason: "Auth subject mismatch" };
      }

      return { ok: true, userId: tokenSub };
    } catch {
      return { ok: false, reason: "Invalid access token" };
    }
  }
}

export const socketGateway = new SocketGateway();
