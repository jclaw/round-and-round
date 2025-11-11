import { io, Socket } from "socket.io-client";

export interface MouseMessage { x: number; y: number }
export interface CountMessage { count: number }

export function createSocket(serverUrl: string): Socket {
  return io(serverUrl, {
    withCredentials: true,
    transports: ["websocket", "polling"],
  });
}
