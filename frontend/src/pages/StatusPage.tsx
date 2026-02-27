import { useState, useEffect } from 'react';

interface StatusServer {
  id: string;
  name: string;
  status: string;
  checkType: string;
  uptimePercent: number;
  avgResponseMs: number | null;
  activeIncident: { status: string; startedAt: string } | null;
}

interface StatusData {
  overallStatus: 'operational' | 'degraded' | 'issues';
  servers: StatusServer[];
  generatedAt: string;
}

const overallConfig = {
  operational: {
    label: 'Todos los sistemas operativos',
    description: 'Nuestros servicios funcionan con normalidad.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
      </svg>
    ),
    color: '#4ade80',
    bgGrad: 'linear-gradient(135deg, rgba(74,222,128,0.12) 0%, rgba(74,222,128,0.03) 100%)',
    borderColor: 'rgba(74,222,128,0.25)',
  },
  degraded: {
    label: 'Rendimiento degradado',
    description: 'Algunos servicios experimentan lentitud.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
    color: '#facc15',
    bgGrad: 'linear-gradient(135deg, rgba(250,204,21,0.12) 0%, rgba(250,204,21,0.03) 100%)',
    borderColor: 'rgba(250,204,21,0.25)',
  },
  issues: {
    label: 'Problemas detectados',
    description: 'Estamos trabajando para restaurar los servicios afectados.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
    color: '#f87171',
    bgGrad: 'linear-gradient(135deg, rgba(248,113,113,0.12) 0%, rgba(248,113,113,0.03) 100%)',
    borderColor: 'rgba(248,113,113,0.25)',
  },
};

function timeSince(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'hace unos segundos';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h ${mins % 60}m`;
  return `hace ${Math.floor(hours / 24)}d`;
}

export function StatusPage() {
  const [data, setData] = useState<StatusData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchStatus = () => {
      fetch('/api/status/public')
        .then((res) => res.json())
        .then((d) => { setData(d); setError(false); })
        .catch(() => setError(true));
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center page-bg">
        <div className="text-center animate-fade-in">
          <svg className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--border)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-[16px]" style={{ color: 'var(--text-secondary)' }}>No se pudo cargar el estado de los servicios.</p>
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

  const overall = overallConfig[data.overallStatus];
  const upCount = data.servers.filter((s) => s.status === 'up').length;
  const totalCount = data.servers.length;

  return (
    <div className="min-h-screen page-bg">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#232f3e] via-[#2a3748] to-[#232f3e] border-b shadow-lg shadow-black/20" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="WOW Desarrollo Digital" className="h-12" />
            <div>
              <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Estado de los servicios</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--text-muted)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#E1A72C] animate-pulse" />
            En vivo
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Overall status hero */}
        <div
          className="rounded-2xl p-6 mb-8 animate-fade-in relative overflow-hidden"
          style={{ background: overall.bgGrad, border: `1px solid ${overall.borderColor}`, boxShadow: `0 8px 32px rgba(0,0,0,0.2), 0 0 60px ${overall.color}08` }}
        >
          <div className="flex items-center gap-5">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: `${overall.color}15`, color: overall.color }}
            >
              {overall.icon}
            </div>
            <div className="flex-1">
              <h1 className="text-[22px] font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{overall.label}</h1>
              <p className="text-[15px]" style={{ color: 'var(--text-secondary)' }}>{overall.description}</p>
            </div>
            <div className="text-right shrink-0 hidden sm:block">
              <div className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{upCount}<span className="text-lg font-normal" style={{ color: 'var(--text-muted)' }}>/{totalCount}</span></div>
              <div className="text-[13px] mt-0.5" style={{ color: 'var(--text-muted)' }}>servicios activos</div>
            </div>
          </div>
        </div>

        {/* Servers grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {data.servers.map((server, i) => {
            const isUp = server.status === 'up';
            const isDegraded = server.status === 'degraded';
            const color = isUp ? '#4ade80' : isDegraded ? '#facc15' : '#f87171';
            const dotGlow = isUp ? 'glow-green' : isDegraded ? 'glow-yellow' : 'glow-red';
            const statusLabel = isUp ? 'Operativo' : isDegraded ? 'Lento' : 'Caido';
            const statusIcon = isUp ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : isDegraded ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            );

            return (
              <div
                key={server.id}
                className={`card-static overflow-hidden animate-fade-in stagger-${Math.min(i + 1, 8)} group transition-all`}
              >
                {/* Status color bar */}
                <div className="h-[3px]" style={{ background: `linear-gradient(to right, ${color}, ${color}50)` }} />

                <div className="p-5">
                  {/* Server header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className={`w-2.5 h-2.5 rounded-full ${dotGlow}`} style={{ backgroundColor: color }} />
                      <span className="text-[16px] font-semibold" style={{ color: 'var(--text-primary)' }}>{server.name}</span>
                    </div>
                    <span
                      className="flex items-center gap-1.5 text-[13px] font-semibold px-2.5 py-1 rounded-lg"
                      style={{ background: `${color}15`, color }}
                    >
                      {statusIcon}
                      {statusLabel}
                    </span>
                  </div>

                  {/* Active incident */}
                  {server.activeIncident && (
                    <div className="mt-4 bg-red-400/8 border border-red-400/15 rounded-lg px-4 py-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                        <span className="text-[13px] font-semibold text-red-400">
                          {server.activeIncident.status === 'down' ? 'Servidor caido' : 'Rendimiento degradado'}
                        </span>
                      </div>
                      <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                        Desde {new Date(server.activeIncident.startedAt).toLocaleString()} — {timeSince(server.activeIncident.startedAt)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {data.servers.length === 0 && (
          <div className="card-static text-center py-16 animate-fade-in">
            <svg className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--border)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />
            </svg>
            <p className="text-[16px] mb-1" style={{ color: 'var(--text-secondary)' }}>No hay servicios publicos</p>
            <p className="text-[14px]" style={{ color: 'var(--text-muted)' }}>Aun no se han configurado servidores visibles.</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-center gap-6 text-[13px] pt-4 border-t" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
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
