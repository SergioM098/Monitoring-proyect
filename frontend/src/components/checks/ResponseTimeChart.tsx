import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  ReferenceLine
} from 'recharts';
import type { Check } from '../../types';

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: { status: string; fullTime: string } }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  const data = payload[0];
  const statusColors: Record<string, string> = { up: '#4ade80', down: '#f87171', degraded: '#facc15' };
  const color = statusColors[data.payload.status] || '#879ab8';

  return (
    <div className="border border-[var(--border)] rounded-lg px-3 py-2 shadow-xl" style={{ background: 'var(--bg-card)' }}>
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-[12px] font-semibold text-[var(--text-primary)] uppercase">{data.payload.status}</span>
      </div>
      <div className="text-[15px] text-[var(--text-primary)] font-mono font-bold">{data.value} <span className="text-[var(--text-muted)] text-[12px] font-normal">ms</span></div>
      <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{data.payload.fullTime}</div>
    </div>
  );
};

export function ResponseTimeChart({ checks }: { checks: Check[] }) {
  const styles = getComputedStyle(document.documentElement);
  const bgCard = styles.getPropertyValue('--bg-card').trim();
  const borderColor = styles.getPropertyValue('--border').trim();
  const textMuted = styles.getPropertyValue('--text-muted').trim();

  const data = [...checks]
    .slice(0, 50)
    .reverse()
    .map((c) => ({
      time: new Date(c.checkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      fullTime: new Date(c.checkedAt).toLocaleString(),
      ms: c.responseTimeMs ?? 0,
      status: c.status,
    }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[220px] text-[var(--text-muted)] text-[14px]">
        Sin datos aun
      </div>
    );
  }

  const avgMs = Math.round(data.reduce((a, b) => a + b.ms, 0) / data.length);
  const maxMs = Math.max(...data.map((d) => d.ms));
  const minMs = Math.min(...data.filter((d) => d.ms > 0).map((d) => d.ms));

  return (
    <div>
      <div className="flex gap-6 mb-4">
        <div>
          <div className="text-[12px] text-[var(--text-muted)] uppercase tracking-wide font-medium">Promedio</div>
          <div className="text-lg font-bold font-mono text-[var(--text-primary)]">{avgMs}<span className="text-[12px] text-[var(--text-muted)] ml-0.5">ms</span></div>
        </div>
        <div>
          <div className="text-[12px] text-[var(--text-muted)] uppercase tracking-wide font-medium">Minimo</div>
          <div className="text-lg font-bold font-mono text-green-400">{minMs}<span className="text-[12px] text-[var(--text-muted)] ml-0.5">ms</span></div>
        </div>
        <div>
          <div className="text-[12px] text-[var(--text-muted)] uppercase tracking-wide font-medium">Maximo</div>
          <div className="text-lg font-bold font-mono text-[#E1A72C]">{maxMs}<span className="text-[12px] text-[var(--text-muted)] ml-0.5">ms</span></div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="responseGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E1A72C" stopOpacity={0.2} />
              <stop offset="50%" stopColor="#E1A72C" stopOpacity={0.05} />
              <stop offset="100%" stopColor="#E1A72C" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={borderColor} vertical={false} />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 11, fill: textMuted }}
            axisLine={{ stroke: borderColor }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: textMuted }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `${v}`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: borderColor, strokeDasharray: '4 4' }} />
          <ReferenceLine
            y={avgMs}
            stroke={textMuted}
            strokeDasharray="6 3"
            strokeOpacity={0.5}
          />
          <Area
            type="monotone"
            dataKey="ms"
            stroke="#E1A72C"
            strokeWidth={2}
            fill="url(#responseGradient)"
            dot={false}
            activeDot={{ r: 4, fill: '#E1A72C', stroke: bgCard, strokeWidth: 2 }}
            animationDuration={800}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
