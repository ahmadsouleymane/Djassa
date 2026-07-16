import type { Server as HttpServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import jwt from "jsonwebtoken";
import { config } from "../shared/config/index.js";
import { logger } from "../shared/logger/index.js";

let io: SocketIOServer | undefined;

export function initRealtime(httpServer: HttpServer) {
  io = new SocketIOServer(httpServer, {
    cors: { origin: config.corsOrigin, credentials: true },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;
    if (!token) return next(new Error("Authentification requise"));

    try {
      const payload = jwt.verify(token, config.jwt.accessSecret) as { userId: string };
      socket.data.userId = payload.userId;
      next();
    } catch {
      next(new Error("Session invalide"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId as string;
    socket.join(`user:${userId}`);
    logger.debug({ userId, socketId: socket.id }, "Socket connecté");
  });

  return io;
}

export function emitToUser(userId: string, event: string, payload: unknown) {
  io?.to(`user:${userId}`).emit(event, payload);
}
