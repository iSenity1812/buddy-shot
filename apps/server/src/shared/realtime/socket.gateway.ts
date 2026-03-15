import type { Server as HttpServer } from "http";
import { Server as SocketIOServer, type Socket } from "socket.io";
import { envConfig } from "@/shared/config/env.config";

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

    this.io.on("connection", (socket) => {
      const userId = this.extractUserId(socket);
      if (!userId) {
        return;
      }

      socket.join(this.getUserRoom(userId));
      socket.emit("socket:ready", { userId });
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

  private extractUserId(socket: Socket): string | null {
    const fromAuth = socket.handshake.auth?.userId;
    if (typeof fromAuth === "string" && fromAuth.trim()) {
      return fromAuth.trim();
    }

    const fromQuery = socket.handshake.query.userId;
    if (typeof fromQuery === "string" && fromQuery.trim()) {
      return fromQuery.trim();
    }

    return null;
  }
}

export const socketGateway = new SocketGateway();
