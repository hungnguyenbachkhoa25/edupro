import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = (userId?: string) => {
  if (socket) return socket;

  if (!userId) {
    console.error("Cannot initialize socket without userId");
    return null;
  }

  socket = io({
    path: "/socket.io",
    query: { userId },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => {
    console.log("Connected to WebSocket server");
  });

  socket.on("disconnect", () => {
    console.log("Disconnected from WebSocket server");
  });

  socket.on("connect_error", (error: any) => {
    console.error("Connection error:", error);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
