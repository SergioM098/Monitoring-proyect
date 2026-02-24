import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { useSocketEvent } from './useSocket';
import type { Server } from '../types';

export function useServers() {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchServers = useCallback(async () => {
    try {
      const { data } = await api.get<Server[]>('/servers');
      setServers(data);
    } catch (err) {
      console.error('Failed to fetch servers', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchServers(); }, [fetchServers]);

  useSocketEvent<Server>('server:created', useCallback((server: Server) => {
    setServers((prev) => [server, ...prev]);
  }, []));

  useSocketEvent<Server>('server:updated', useCallback((updated: Server) => {
    setServers((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }, []));

  useSocketEvent<{ id: string }>('server:deleted', useCallback(({ id }: { id: string }) => {
    setServers((prev) => prev.filter((s) => s.id !== id));
  }, []));

  useSocketEvent<{ serverId: string; newStatus: string }>(
    'server:statusChanged',
    useCallback(({ serverId, newStatus }: { serverId: string; newStatus: string }) => {
      setServers((prev) =>
        prev.map((s) => (s.id === serverId ? { ...s, status: newStatus } : s))
      );
    }, [])
  );

  return { servers, loading, refetch: fetchServers };
}
