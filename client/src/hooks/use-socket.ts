import { useEffect, useRef } from "react";
import { getSocket, disconnectSocket } from "@/lib/socket";
import { useAuth } from "@/hooks/use-auth";
import type { Socket } from "socket.io-client";

export function useSocket() {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (user?.id) {
      const socket = getSocket(user.id);
      socketRef.current = socket;

      return () => {
        // We don't necessarily want to disconnect the global socket on every unmount
        // but we can clean up some things if needed.
        // For now, let the global instance handle reconnection.
      };
    } else {
      disconnectSocket();
      socketRef.current = null;
    }
  }, [user?.id]);

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected ?? false,
  };
}
