import { useState, useEffect, useCallback } from 'react';
import { StatusBadge } from '../components/servers/StatusBadge';
import api, { downloadCsv } from '../api/client';
import type { Incident, Server } from '../types';

function formatDuration(ms: number | null): string {
  if (!ms) return 'En curso';
  const secs = Math.floor(ms / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ${secs % 60}s`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ${mins % 60}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Justo ahora';
  if (mins < 60) return `Hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days}d`;
}

interface Stats {
  serverId: string;
  serverName: string;
  incidentCount: number;
  totalDowntimeMs: number;
  uptimePercent: number;
  activeIncident: Incident | null;
}

export function Incidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [stats, setStats] = useState<Stats[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [filterId, setFilterId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchIncidents = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterId) params.set('serverId', filterId);
    if (filterStatus) params.set('status', filterStatus);
    if (dateFrom) params.set('from', dateFrom);
    if (dateTo) params.set('to', dateTo);

    const { data } = await api.get(`/incidents?${params}`);
    setIncidents(data.incidents);
    setTotal(data.total);
  }, [filterId, filterStatus, dateFrom, dateTo]);

  useEffect(() => {
    api.get('/servers').then(({ data }) => setServers(data));
    api.get('/incidents/stats').then(({ data }) => setStats(data.stats));
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchIncidents().finally(() => setLoading(false));
  }, [fetchIncidents]);

  const exportCsv = () => {
    const params = new URLSearchParams();
    if (filterId) params.set('serverId', filterId);
    if (dateFrom) params.set('from', dateFrom);
    if (dateTo) params.set('to', dateTo);
    downloadCsv(`/reports/incidents?${params}`, 'incidentes.csv');
  };

  const activeCount = stats.filter(s => s.activeIncident).length;
  const totalIncidents = stats.reduce((sum, s) => sum + s.incidentCount, 0);
  const avgUptime = stats.length ? (stats.reduce((sum, s) => sum + s.uptimePercent, 0) / stats.length) : 100;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E1A72C]/20 to-[#E1A72C]/5 border border-[#E1A72C]/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-[#E1A72C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <h1 className="text-[22px] font-semibold" style={{ color: 'var(--text-primary)' }}>Incidentes</h1>
            <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>Historial de caidas y degradaciones</p>
          </div>
        </div>
        <button
          onClick={exportCsv}
          className="px-4 py-2.5 text-[14px] font-medium rounded-lg transition-all flex items-center gap-2 border hover:border-[#E1A72C]/40"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Exportar CSV
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card-static p-4 animate-fade-in stagger-1">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-400/10 flex items-center justify-center">
              <svg className="w-4.5 h-4.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <div className="text-[12px] uppercase tracking-wider font-medium" style={{ color: 'var(--text-muted)' }}>Activos ahora</div>
              <div className="text-[20px] font-bold" style={{ color: activeCount > 0 ? '#f87171' : 'var(--text-primary)' }}>{activeCount}</div>
            </div>
          </div>
        </div>
        <div className="card-static p-4 animate-fade-in stagger-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#E1A72C]/10 flex items-center justify-center">
              <svg className="w-4.5 h-4.5 text-[#E1A72C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
            <div>
              <div className="text-[12px] uppercase tracking-wider font-medium" style={{ color: 'var(--text-muted)' }}>Total incidentes</div>
              <div className="text-[20px] font-bold" style={{ color: 'var(--text-primary)' }}>{totalIncidents}</div>
            </div>
          </div>
        </div>
        <div className="card-static p-4 animate-fade-in stagger-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-green-400/10 flex items-center justify-center">
              <svg className="w-4.5 h-4.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-[12px] uppercase tracking-wider font-medium" style={{ color: 'var(--text-muted)' }}>Uptime promedio</div>
              <div className="text-[20px] font-bold" style={{ color: avgUptime >= 99 ? '#4ade80' : avgUptime >= 95 ? '#E1A72C' : '#f87171' }}>{avgUptime.toFixed(2)}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Per-server stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats.map((s, i) => (
          <div
            key={s.serverId}
            className={`card-static overflow-hidden animate-fade-in stagger-${Math.min(i + 1, 8)}`}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[14px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>{s.serverName}</span>
                {s.activeIncident && (
                  <span className="flex items-center gap-1.5 text-[11px] bg-red-400/10 text-red-400 px-2 py-0.5 rounded-full shrink-0 ml-2 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                    Caido
                  </span>
                )}
              </div>

              {/* Uptime bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Uptime</span>
                  <span className={`text-[12px] font-bold ${s.uptimePercent >= 99 ? 'text-green-400' : s.uptimePercent >= 95 ? 'text-[#E1A72C]' : 'text-red-400'}`}>
                    {s.uptimePercent.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                  <div
                    className={`h-full rounded-full transition-all ${s.uptimePercent >= 99 ? 'bg-green-400' : s.uptimePercent >= 95 ? 'bg-[#E1A72C]' : 'bg-red-400'}`}
                    style={{ width: `${Math.max(s.uptimePercent, 0)}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-between text-[12px]" style={{ color: 'var(--text-muted)' }}>
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  {s.incidentCount}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {formatDuration(s.totalDowntimeMs)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card-static p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-4 h-4" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
          </svg>
          <span className="text-[13px] font-medium" style={{ color: 'var(--text-secondary)' }}>Filtros</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={filterId}
            onChange={(e) => setFilterId(e.target.value)}
            className="border rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:border-[#E1A72C] transition-all"
            style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          >
            <option value="">Todos los servidores</option>
            {servers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:border-[#E1A72C] transition-all"
            style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          >
            <option value="">Todos los estados</option>
            <option value="down">Caido</option>
            <option value="degraded">Lento</option>
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:border-[#E1A72C] transition-all"
            style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:border-[#E1A72C] transition-all"
            style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
        </div>
      </div>

      {/* Incidents timeline */}
      <div className="card-static overflow-hidden">
        <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[14px] font-medium" style={{ color: 'var(--text-primary)' }}>Timeline</span>
          </div>
          <span className="text-[13px] px-2.5 py-0.5 rounded-full" style={{ color: 'var(--text-muted)', background: 'var(--bg-input)' }}>{total} registros</span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-6 h-6 border-2 rounded-full animate-spin mb-3" style={{ borderColor: 'var(--border)', borderTopColor: '#E1A72C' }} />
            <span className="text-[14px]" style={{ color: 'var(--text-muted)' }}>Cargando incidentes...</span>
          </div>
        ) : incidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 rounded-xl bg-green-400/10 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-[14px] font-medium" style={{ color: 'var(--text-primary)' }}>Sin incidentes</span>
            <span className="text-[13px] mt-0.5" style={{ color: 'var(--text-muted)' }}>No se encontraron incidentes con estos filtros</span>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {incidents.map((inc) => {
              const isActive = !inc.resolvedAt;
              const duration = isActive
                ? Date.now() - new Date(inc.startedAt).getTime()
                : inc.durationMs;
              return (
                <div
                  key={inc.id}
                  className="px-5 py-4 flex items-center gap-4 table-row-hover transition-colors"
                  style={isActive ? { borderLeft: '3px solid #f87171' } : {}}
                >
                  {/* Status icon */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isActive ? 'bg-red-400/10' : inc.status === 'degraded' ? 'bg-yellow-400/10' : 'bg-red-400/5'
                  }`}>
                    {isActive ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse" />
                    ) : inc.status === 'degraded' ? (
                      <svg className="w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-red-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                    )}
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-medium" style={{ color: 'var(--text-primary)' }}>{inc.server?.name ?? '-'}</span>
                      <StatusBadge status={inc.status} />
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-[12px]" style={{ color: 'var(--text-muted)' }}>
                      <span>{new Date(inc.startedAt).toLocaleString()}</span>
                      {inc.resolvedAt && (
                        <>
                          <span>→</span>
                          <span>{new Date(inc.resolvedAt).toLocaleString()}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="text-right shrink-0">
                    <div className={`text-[14px] font-mono font-medium ${isActive ? 'text-red-400' : ''}`} style={isActive ? {} : { color: 'var(--text-primary)' }}>
                      {formatDuration(duration)}
                    </div>
                    <div className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                      {timeAgo(inc.startedAt)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
