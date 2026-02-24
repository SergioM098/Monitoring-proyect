import { useEffect } from 'react';
import { useSocketContext } from '../context/SocketContext';

export function useSocketEvent<T>(event: string, handler: (data: T) => void) {
  const socket = useSocketContext();

  useEffect(() => {
    if (!socket) return;
    socket.on(event, handler);
    return () => { socket.off(event, handler); };
  }, [socket, event, handler]);
}
