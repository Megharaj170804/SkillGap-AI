import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let globalSocket: Socket | null = null;

export const getSocket = () => globalSocket;

export const connectSocket = (employeeId?: string, department?: string) => {
  if (!globalSocket || !globalSocket.connected) {
    globalSocket = io(SOCKET_URL, { withCredentials: true, transports: ['websocket', 'polling'] });

    globalSocket.on('connect', () => {
      if (employeeId) globalSocket!.emit('join_room', { employeeId });
      if (department) globalSocket!.emit('join_department', { department });
    });
  }
  return globalSocket;
};

export const disconnectSocket = () => {
  if (globalSocket) {
    globalSocket.disconnect();
    globalSocket = null;
  }
};

interface UseSocketOptions {
  employeeId?: string;
  department?: string;
  events?: Record<string, (data: any) => void>;
}

export const useSocket = ({ employeeId, department, events = {} }: UseSocketOptions) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = connectSocket(employeeId, department);
    socketRef.current = socket;

    // Register event listeners
    Object.entries(events).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    return () => {
      // Clean up listeners on unmount
      Object.entries(events).forEach(([event, handler]) => {
        socket.off(event, handler);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, department]);

  return socketRef.current;
};

export default useSocket;
