import { useState, useEffect, useCallback } from 'react';
import api from '../../api/client';
import { useSocketEvent } from '../../hooks/useSocket';
import type { Check } from '../../types';

const statusStyle: Record<string, { bg: string; glow: string }> = {
  up: { bg: 'bg-emerald-400', glow: 'shadow-emerald-400/40' },
  down: { bg: 'bg-red-500', glow: 'shadow-red-500/40' },
  degraded: { bg: 'bg-amber-400', glow: 'shadow-amber-400/40' },
};

interface Props {
  serverId: string;
  count?: number;
}

export function UptimeBar({ serverId, count = 5 }: Props) {
  const [checks, setChecks] = useState<Check[]>([]);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  useEffect(() => {
    api.get(`/checks/${serverId}?limit=${count}`).then(({ data }) => {
      setChecks(data.checks ?? data);
    });
  }, [serverId, count]);

  useSocketEvent<{ serverId: string; check: Check }>(
    'check:new',
    useCallback(({ serverId: sid, check }: { serverId: string; check: Check }) => {
      if (sid === serverId) {
        setChecks((prev) => [check, ...prev.slice(0, count - 1)]);
      }
    }, [serverId, count])
  );

  const bars = [...checks].reverse();

  return (
    <div className="flex gap-1 items-end h-6">
      {Array.from({ length: Math.max(0, count - bars.length) }).map((_, i) => (
        <div key={`e-${i}`} className="w-3 h-full rounded-sm bg-[var(--border)]" />
      ))}
      {bars.map((check, idx) => {
        const style = statusStyle[check.status] || { bg: 'bg-gray-600', glow: '' };
        const isHovered = hoveredIdx === idx;

        return (
          <div
            key={check.id}
            className="relative"
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <div
              className={`w-3 h-6 rounded-sm transition-all duration-200 ${style.bg} ${isHovered ? `${style.glow} shadow-lg opacity-100` : 'opacity-80'}`}
            />
            {isHovered && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
                <div className="border border-[var(--border)] rounded-lg px-3 py-2 shadow-xl whitespace-nowrap" style={{ background: 'var(--bg-card)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${style.bg}`} />
                    <span className="text-xs font-semibold text-[var(--text-primary)] uppercase">{check.status}</span>
                  </div>
                  {check.responseTimeMs != null && (
                    <div className="text-xs text-[var(--text-secondary)]">
                      <span className="text-[var(--text-primary)] font-mono">{check.responseTimeMs}</span> ms
                    </div>
                  )}
                  <div className="text-[11px] text-[var(--text-muted)] mt-1">
                    {new Date(check.checkedAt).toLocaleString()}
                  </div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 border-r border-b border-[var(--border)] rotate-45 -mt-1" style={{ background: 'var(--bg-card)' }} />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
