import { useCallback } from 'react';
import { useSocketEvent } from '../hooks/useSocket';
import { useToast } from '../context/ToastContext';
import type { Server, Incident } from '../types';

export function GlobalSocketToasts() {
  const { addToast } = useToast();

  useSocketEvent<Server>(
    'server:created',
    useCallback((server: Server) => {
      addToast(`Servidor "${server.name}" creado`, 'success');
    }, [addToast])
  );

  useSocketEvent<{ id: string }>(
    'server:deleted',
    useCallback(() => {
      addToast('Servidor eliminado', 'info');
    }, [addToast])
  );

  useSocketEvent<{ serverId: string; previousStatus: string; newStatus: string }>(
    'server:statusChanged',
    useCallback(({ newStatus }: { serverId: string; previousStatus: string; newStatus: string }) => {
      if (newStatus === 'down') {
        addToast('Un servidor ha caido', 'error');
      } else if (newStatus === 'degraded') {
        addToast('Un servidor esta lento', 'warning');
      } else if (newStatus === 'up') {
        addToast('Servidor recuperado', 'success');
      }
    }, [addToast])
  );

  useSocketEvent<{ serverId: string; incident: Incident }>(
    'incident:created',
    useCallback(() => {
      addToast('Nuevo incidente detectado', 'error');
    }, [addToast])
  );

  useSocketEvent<{ serverId: string; incident: Incident }>(
    'incident:resolved',
    useCallback(() => {
      addToast('Incidente resuelto', 'success');
    }, [addToast])
  );

  return null;
}
