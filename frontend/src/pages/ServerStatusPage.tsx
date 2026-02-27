import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ResponseTimeChart } from '../components/checks/ResponseTimeChart';
import type { Check } from '../types';

interface ServerStatusData {
  server: { name: string; status: string; checkType: string };
  uptimePercent: number;
  avgResponseMs: number | null;
  recentChecks: Check[];
  activeIncident: { status: string; startedAt: string } | null;
  incidentHistory: Array<{
    status: string;
    startedAt: string;
    resolvedAt: string;
    durationMs: number | null;
  }>;
  generatedAt: string;
}

function timeSince(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'hace unos segundos';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h ${mins % 60}m`;
  return `hace ${Math.floor(hours / 24)}d`;
}

function formatDuration(ms: number | null) {
  if (!ms) return '-';
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ${seconds % 60}s`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ${mins % 60}m`;
}

const statusConfig = {
  up: { label: 'Operativo', color: '#4ade80', glow: 'glow-green', icon: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  )},
  degraded: { label: 'Lento', color: '#facc15', glow: 'glow-yellow', icon: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5" />
    </svg>
  )},
  down: { label: 'Caido', color: '#f87171', glow: 'glow-red', icon: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )},
};

export function ServerStatusPage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<ServerStatusData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = () => {
      fetch(`/api/status/public/${slug}`)
        .then((res) => {
          if (res.status === 404) throw new Error('not_found');
          if (!res.ok) throw new Error('error');
          return res.json();
        })
        .then((d) => { setData(d); setError(null); })
        .catch((e) => setError(e.message === 'not_found' ? 'not_found' : 'error'));
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [slug]);

  if (error === 'not_found') {
    return (
      <div className="min-h-screen flex items-center justify-center page-bg">
        <div className="text-center animate-fade-in">
          <svg className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--border)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-[16px]" style={{ color: 'var(--text-secondary)' }}>Esta pagina no existe o el servidor no es publico.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center page-bg">
        <div className="text-center animate-fade-in">
          <svg className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--border)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-[16px]" style={{ color: 'var(--text-secondary)' }}>No se pudo cargar el estado del servicio.</p>
          <p className="text-[14px] mt-1" style={{ color: 'var(--text-muted)' }}>Intenta recargar la pagina.</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center page-bg">
        <div className="text-center animate-fade-in">
          <div className="inline-block w-8 h-8 border-2 border-t-[#E1A72C] rounded-full animate-spin mb-4" style={{ borderColor: 'var(--border)', borderTopColor: '#E1A72C' }} />
          <p className="text-[15px]" style={{ color: 'var(--text-secondary)' }}>Cargando estado...</p>
        </div>
      </div>
    );
  }

  const cfg = statusConfig[data.server.status as keyof typeof statusConfig] ?? statusConfig.down;

  return (
    <div className="min-h-screen page-bg">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#232f3e] via-[#2a3748] to-[#232f3e] border-b shadow-lg shadow-black/20" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="WOW Desarrollo Digital" className="h-12" />
            <div>
              <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Estado del servicio</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--text-muted)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#E1A72C] animate-pulse" />
            En vivo
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Server status hero */}
        <div
          className="rounded-2xl p-6 mb-6 animate-fade-in relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${cfg.color}12 0%, ${cfg.color}03 100%)`,
            border: `1px solid ${cfg.color}40`,
            boxShadow: `0 8px 32px rgba(0,0,0,0.2), 0 0 60px ${cfg.color}08`,
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: `${cfg.color}15`, color: cfg.color }}
              >
                {cfg.icon}
              </div>
              <div>
                <h1 className="text-[22px] font-bold" style={{ color: 'var(--text-primary)' }}>{data.server.name}</h1>
                <span
                  className="inline-flex items-center gap-1.5 text-[14px] font-semibold mt-1 px-2.5 py-0.5 rounded-lg"
                  style={{ background: `${cfg.color}15`, color: cfg.color }}
                >
                  {cfg.label}
                </span>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <div className="text-3xl font-bold font-mono" style={{ color: cfg.color }}>{data.uptimePercent}%</div>
              <div className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>disponibilidad 30d</div>
            </div>
          </div>
        </div>

        {/* Active incident */}
        {data.activeIncident && (
          <div className="card-static mb-6 overflow-hidden animate-fade-in">
            <div className="bg-red-400/8 border-b border-red-400/15 px-4 py-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              <span className="text-[14px] font-semibold text-red-400">Incidente activo</span>
            </div>
            <div className="p-4">
              <p className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>
                {data.activeIncident.status === 'down' ? 'Servidor caido' : 'Rendimiento degradado'}
              </p>
              <p className="text-[13px] mt-1" style={{ color: 'var(--text-muted)' }}>
                Desde {new Date(data.activeIncident.startedAt).toLocaleString()} — {timeSince(data.activeIncident.startedAt)}
              </p>
            </div>
          </div>
        )}

        {/* Response time chart */}
        {data.recentChecks.length > 0 && (
          <div className="card-static mb-6 overflow-hidden animate-fade-in">
            <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
              <svg className="w-4 h-4 text-[#E1A72C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
              <h2 className="text-[15px] font-medium" style={{ color: 'var(--text-primary)' }}>Tiempo de respuesta</h2>
              {data.avgResponseMs !== null && (
                <span className="ml-auto text-[13px] font-mono" style={{ color: 'var(--text-muted)' }}>
                  Promedio: {data.avgResponseMs}ms
                </span>
              )}
            </div>
            <div className="p-4">
              <ResponseTimeChart checks={data.recentChecks} />
            </div>
          </div>
        )}

        {/* Incident history */}
        {data.incidentHistory.length > 0 && (
          <div className="card-static overflow-hidden animate-fade-in">
            <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
              <svg className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-[15px] font-medium" style={{ color: 'var(--text-primary)' }}>Historial de incidentes</h2>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {data.incidentHistory.map((inc, i) => {
                const incColor = inc.status === 'down' ? '#f87171' : '#facc15';
                const incLabel = inc.status === 'down' ? 'Caido' : 'Lento';
                return (
                  <div key={i} className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: incColor }} />
                      <div>
                        <span className="text-[14px] font-medium" style={{ color: 'var(--text-primary)' }}>{incLabel}</span>
                        <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                          {new Date(inc.startedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <span className="text-[13px] font-mono" style={{ color: 'var(--text-secondary)' }}>
                      {formatDuration(inc.durationMs)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-center gap-6 text-[13px] pt-6 mt-6 border-t" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {new Date(data.generatedAt).toLocaleString()}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E1A72C] animate-pulse" />
            Se actualiza cada 30s
          </span>
        </div>
      </div>
    </div>
  );
}
