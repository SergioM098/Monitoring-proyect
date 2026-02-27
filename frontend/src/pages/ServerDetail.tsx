import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCheckHistory } from '../hooks/useCheckHistory';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/servers/StatusBadge';
import { ResponseTimeChart } from '../components/checks/ResponseTimeChart';
import api, { downloadCsv } from '../api/client';
import type { Server, Check } from '../types';

const PAGE_SIZE = 15;

const statusColors: Record<string, string> = {
  up: '#4ade80',
  down: '#f87171',
  degraded: '#facc15',
};

export function ServerDetail() {
  const { id } = useParams<{ id: string }>();
  const { checks: chartChecks, loading: checksLoading } = useCheckHistory(id!);
  const { isAdmin } = useAuth();
  const [server, setServer] = useState<Server | null>(null);

  const [page, setPage] = useState(0);
  const [pageChecks, setPageChecks] = useState<Check[]>([]);
  const [totalChecks, setTotalChecks] = useState(0);
  const [pageLoading, setPageLoading] = useState(true);

  const totalPages = Math.max(1, Math.ceil(totalChecks / PAGE_SIZE));

  const fetchPage = useCallback(async (p: number) => {
    setPageLoading(true);
    try {
      const { data } = await api.get(`/checks/${id}?limit=${PAGE_SIZE}&offset=${p * PAGE_SIZE}`);
      setPageChecks(data.checks);
      setTotalChecks(data.total);
    } catch { /* ignore */ } finally {
      setPageLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchPage(page); }, [page, fetchPage]);

  useEffect(() => {
    api.get(`/servers/${id}`).then(({ data }) => setServer(data));
  }, [id]);

  if (!server) {
    return (
      <div className="text-center py-16" style={{ color: 'var(--text-secondary)' }}>
        <div className="inline-block w-6 h-6 border-2 border-t-[#E1A72C] rounded-full animate-spin mb-3" style={{ borderColor: 'var(--border)', borderTopColor: '#E1A72C' }} />
        <p className="text-[14px]">Cargando...</p>
      </div>
    );
  }

  const accentColor = statusColors[server.status] ?? '#546b8a';

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[14px] mb-4">
        <Link to="/" className="hover:text-[#E1A72C] transition-colors flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
          Dashboard
        </Link>
        <span style={{ color: 'var(--text-muted)' }}>/</span>
        <span style={{ color: 'var(--text-primary)' }}>{server.name}</span>
      </div>

      {/* Server header */}
      <div className="card-static overflow-hidden mb-4">
        <div className="h-[3px]" style={{ background: `linear-gradient(to right, ${accentColor}, ${accentColor}40)` }} />
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <StatusBadge status={server.status} size="lg" />
              <div>
                <h1 className="text-[22px] font-semibold" style={{ color: 'var(--text-primary)' }}>{server.name}</h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[12px] px-2 py-0.5 rounded uppercase font-medium" style={{ color: 'var(--text-secondary)', background: 'var(--bg-input)' }}>
                    {server.checkType}
                  </span>
                  <span className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>{server.url}</span>
                  <span className="text-[13px]" style={{ color: 'var(--text-muted)' }}>cada {server.intervalSec}s</span>
                  {!server.enabled && (
                    <span className="text-[12px] bg-yellow-400/10 text-yellow-400 px-2 py-0.5 rounded">Pausado</span>
                  )}
                </div>
              </div>
            </div>
            {isAdmin && (
              <div className="flex items-center gap-2">
                {server.isPublic && server.publicSlug && (
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/status/${server.publicSlug}`;
                      navigator.clipboard.writeText(url);
                    }}
                    className="px-4 py-2 text-[14px] font-medium rounded-lg transition-all flex items-center gap-2 hover:opacity-80"
                    style={{ background: 'var(--border)', color: 'var(--text-primary)' }}
                    title="Copiar enlace publico"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.07a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.34 8.374" />
                    </svg>
                    Copiar enlace
                  </button>
                )}
                <Link
                  to={`/servers/${id}/edit`}
                  className="px-4 py-2 text-[14px] font-medium rounded-lg transition-all flex items-center gap-2"
                  style={{ background: 'var(--border)', color: 'var(--text-primary)' }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                  Editar
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Response time chart */}
      <div className="card-static mb-4 overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
          <svg className="w-4 h-4 text-[#E1A72C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
          <h2 className="text-[15px] font-medium" style={{ color: 'var(--text-primary)' }}>Tiempo de respuesta</h2>
        </div>
        <div className="p-4">
          {checksLoading ? (
            <div className="text-[14px] text-center py-8" style={{ color: 'var(--text-muted)' }}>Cargando...</div>
          ) : (
            <ResponseTimeChart checks={chartChecks} />
          )}
        </div>
      </div>

      {/* Check history table */}
      <div className="card-static overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-[15px] font-medium" style={{ color: 'var(--text-primary)' }}>
              Historial de checks
              <span className="ml-2 font-normal" style={{ color: 'var(--text-muted)' }}>({totalChecks})</span>
            </h2>
          </div>
          <button
            onClick={() => downloadCsv(`/reports/checks?serverId=${server.id}`, `checks-${server.name}.csv`)}
            className="text-[13px] text-[#E1A72C] hover:text-[#C98B1E] transition-colors flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Exportar CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-[12px] uppercase tracking-wider border-b" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)', background: 'var(--bg-table-header)' }}>
                <th className="px-4 py-2.5 font-medium">Estado</th>
                <th className="px-4 py-2.5 font-medium">Codigo</th>
                <th className="px-4 py-2.5 font-medium">Tiempo (ms)</th>
                <th className="px-4 py-2.5 font-medium">Error</th>
                <th className="px-4 py-2.5 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {pageLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[14px]" style={{ color: 'var(--text-muted)' }}>Cargando...</td>
                </tr>
              ) : pageChecks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[14px]" style={{ color: 'var(--text-muted)' }}>Sin checks registrados</td>
                </tr>
              ) : (
                pageChecks.map((check, i) => (
                  <tr key={check.id} className="border-b text-[14px] table-row-hover transition-colors" style={{ borderColor: 'var(--border)', background: i % 2 === 0 ? undefined : 'var(--bg-table-alt)' }}>
                    <td className="px-4 py-2.5"><StatusBadge status={check.status} /></td>
                    <td className="px-4 py-2.5 font-mono" style={{ color: 'var(--text-secondary)' }}>{check.statusCode ?? '-'}</td>
                    <td className="px-4 py-2.5 font-mono" style={{ color: 'var(--text-secondary)' }}>{check.responseTimeMs ?? '-'}</td>
                    <td className="px-4 py-2.5 text-red-400 text-[13px] max-w-xs truncate">{check.errorMessage || '-'}</td>
                    <td className="px-4 py-2.5 text-[13px]" style={{ color: 'var(--text-muted)' }}>{new Date(check.checkedAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalChecks > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: 'var(--border)', background: 'var(--bg-table-header)' }}>
            <span className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
              {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, totalChecks)} de {totalChecks}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(0)}
                disabled={page === 0}
                className="px-2.5 py-1.5 text-[13px] rounded-md disabled:cursor-not-allowed transition-all" style={{ color: 'var(--text-secondary)' }}
              >
                Primera
              </button>
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 0}
                className="px-2.5 py-1.5 text-[13px] rounded-md disabled:cursor-not-allowed transition-all" style={{ color: 'var(--text-secondary)' }}
              >
                Anterior
              </button>
              <span className="px-3 py-1.5 text-[13px] bg-[#E1A72C]/20 border border-[#E1A72C]/30 rounded-md font-medium" style={{ color: 'var(--text-primary)' }}>
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages - 1}
                className="px-2.5 py-1.5 text-[13px] rounded-md disabled:cursor-not-allowed transition-all" style={{ color: 'var(--text-secondary)' }}
              >
                Siguiente
              </button>
              <button
                onClick={() => setPage(totalPages - 1)}
                disabled={page >= totalPages - 1}
                className="px-2.5 py-1.5 text-[13px] rounded-md disabled:cursor-not-allowed transition-all" style={{ color: 'var(--text-secondary)' }}
              >
                Ultima
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
