import { io, type Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

let socket: Socket | null = null;

export function connectSocket(accessToken: string): Socket {
  if (socket) socket.disconnect();
  socket = io(SOCKET_URL, { auth: { token: accessToken } });
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
