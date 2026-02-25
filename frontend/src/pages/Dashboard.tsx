import { useState } from 'react';
import { useServers } from '../hooks/useServers';
import { useAuth } from '../context/AuthContext';
import { ServerCard } from '../components/servers/ServerCard';
import { ServerForm } from '../components/servers/ServerForm';

const metricCards = [
  {
    key: 'total',
    label: 'Total',
    color: '#60a5fa',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />
      </svg>
    ),
  },
  {
    key: 'up',
    label: 'Operativos',
    color: '#4ade80',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: 'down',
    label: 'Caidos',
    color: '#f87171',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: 'degraded',
    label: 'Lentos',
    color: '#facc15',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export function Dashboard() {
  const { servers, loading, refetch } = useServers();
  const { isAdmin } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [checkFilter, setCheckFilter] = useState<string>('all');

  const counts: Record<string, number> = {
    total: servers.length,
    up: servers.filter((s) => s.status === 'up').length,
    down: servers.filter((s) => s.status === 'down').length,
    degraded: servers.filter((s) => s.status === 'degraded').length,
  };

  if (loading) {
    return (
      <div className="text-center py-16" style={{ color: 'var(--text-secondary)' }}>
        <div className="inline-block w-6 h-6 border-2 border-t-[#E1A72C] rounded-full animate-spin mb-3" style={{ borderColor: 'var(--border)', borderTopColor: '#E1A72C' }} />
        <p className="text-[14px]">Cargando servidores...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Page header — hero banner */}
      <div className="card-static overflow-hidden mb-6 animate-fade-in" style={{ background: 'var(--bg-card-gradient)' }}>
        <div className="px-6 py-5 flex items-center justify-between relative">
          {/* Decorative accent */}
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#E1A72C] via-[#C98B1E] to-transparent" />

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E1A72C]/20 to-[#E1A72C]/5 border border-[#E1A72C]/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-[#E1A72C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
            </div>
            <div>
              <h1 className="text-[22px] font-bold" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
              <p className="text-[14px] mt-0.5 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-[#E1A72C]" />
                {servers.length} servidores monitoreados
                {counts.down > 0 && (
                  <span className="text-red-400 font-medium ml-1">· {counts.down} con problemas</span>
                )}
              </p>
            </div>
          </div>

          {isAdmin && (
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-[#E1A72C] to-[#C98B1E] hover:from-[#C98B1E] hover:to-[#B07819] text-white text-[14px] font-medium rounded-lg transition-all shadow-md shadow-[#E1A72C]/20 hover:shadow-lg hover:shadow-[#E1A72C]/30 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Agregar servidor
            </button>
          )}
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {metricCards.map((m, i) => (
          <div
            key={m.key}
            className={`card-static overflow-hidden animate-fade-in stagger-${i + 1}`}
            style={{ borderLeft: `3px solid ${m.color}` }}
          >
            <div className="p-4 flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${m.color}15`, color: m.color }}
              >
                {m.icon}
              </div>
              <div>
                <div className="text-[12px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{m.label}</div>
                <div className="text-2xl font-bold mt-0.5" style={{ color: m.key !== 'total' ? m.color : 'var(--text-primary)' }}>
                  {counts[m.key]}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      {servers.length > 0 && (
        <div className="flex items-center gap-2 mb-4 animate-fade-in">
          <svg className="w-4 h-4" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
          </svg>
          {['all', 'http', 'tcp', 'ping'].map((type) => (
            <button
              key={type}
              onClick={() => setCheckFilter(type)}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                checkFilter === type
                  ? 'bg-gradient-to-r from-[#E1A72C] to-[#C98B1E] text-white shadow-sm shadow-[#E1A72C]/20'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-input)]'
              }`}
            >
              {type === 'all' ? 'Todos' : type.toUpperCase()}
              <span className={`ml-1.5 text-[11px] ${checkFilter === type ? 'text-white/70' : ''}`} style={checkFilter !== type ? { color: 'var(--text-muted)' } : undefined}>
                {type === 'all' ? servers.length : servers.filter((s) => s.checkType === type).length}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Server grid */}
      {servers.length === 0 ? (
        <div className="card-static text-center py-16 animate-fade-in">
          <svg className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--border)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />
          </svg>
          <p className="text-[14px]" style={{ color: 'var(--text-muted)' }}>
            No hay servidores configurados.
            {isAdmin && ' Agrega uno para empezar a monitorear.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {servers
            .filter((s) => checkFilter === 'all' || s.checkType === checkFilter)
            .map((server, i) => (
              <div key={server.id} className={`animate-fade-in stagger-${Math.min(i + 1, 8)}`}>
                <ServerCard server={server} />
              </div>
            ))}
        </div>
      )}

      {showForm && <ServerForm onClose={() => { setShowForm(false); refetch(); }} />}
    </div>
  );
}
