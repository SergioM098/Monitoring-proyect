import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { useSocketEvent } from './useSocket';
import type { Check } from '../types';

export function useCheckHistory(serverId: string) {
  const [checks, setChecks] = useState<Check[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChecks = useCallback(async () => {
    try {
      const { data } = await api.get(`/checks/${serverId}`);
      setChecks(data.checks ?? data);
    } catch (err) {
      console.error('Failed to fetch checks', err);
    } finally {
      setLoading(false);
    }
  }, [serverId]);

  useEffect(() => { fetchChecks(); }, [fetchChecks]);

  useSocketEvent<{ serverId: string; check: Check }>(
    'check:new',
    useCallback(({ serverId: sid, check }: { serverId: string; check: Check }) => {
      if (sid === serverId) {
        setChecks((prev) => [check, ...prev.slice(0, 99)]);
      }
    }, [serverId])
  );

  return { checks, loading, refetch: fetchChecks };
}
