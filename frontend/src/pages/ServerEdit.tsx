import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import type { Server } from '../types';

const checkTypes = [
  { value: 'http', label: 'HTTP(S)', placeholder: 'https://example.com', hint: 'Verifica que responda con status 2xx/3xx' },
  { value: 'tcp', label: 'TCP Port', placeholder: '192.168.1.1:22', hint: 'Verifica que el puerto este abierto' },
  { value: 'ping', label: 'Ping', placeholder: '192.168.1.1', hint: 'ICMP ping - solo necesita que el servidor este encendido' },
];

export function ServerEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [server, setServer] = useState<Server | null>(null);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [checkType, setCheckType] = useState('http');
  const [intervalSec, setIntervalSec] = useState(60);
  const [degradedThresholdMs, setDegradedThresholdMs] = useState(5000);
  const [isPublic, setIsPublic] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/servers/${id}`).then(({ data }) => {
      setServer(data);
      setName(data.name);
      setUrl(data.url);
      setCheckType(data.checkType);
      setIntervalSec(data.intervalSec);
      setDegradedThresholdMs(data.degradedThresholdMs);
      setIsPublic(data.isPublic);
      setEnabled(data.enabled);
    }).finally(() => setLoading(false));
  }, [id]);

  const currentType = checkTypes.find((t) => t.value === checkType)!;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    setSaved(false);
    try {
      await api.patch(`/servers/${id}`, { name, url, checkType, intervalSec, degradedThresholdMs, isPublic, enabled });
      setSaved(true);
      setTimeout(() => navigate(`/servers/${id}`), 800);
    } catch {
      setError('Error al actualizar el servidor');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Estas seguro de eliminar este servidor? Se eliminaran todos sus checks e incidentes.')) return;
    try {
      await api.delete(`/servers/${id}`);
      navigate('/');
    } catch {
      setError('Error al eliminar el servidor');
    }
  };

  const inputClass = "w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-[15px] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#E1A72C] transition-all";

  if (loading || !server) {
    return (
      <div className="text-center py-16" style={{ color: 'var(--text-secondary)' }}>
        <div className="inline-block w-6 h-6 border-2 rounded-full animate-spin mb-3" style={{ borderColor: 'var(--border)', borderTopColor: '#E1A72C' }} />
        <p className="text-[14px]">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-2xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[14px] mb-6">
        <Link to="/" className="hover:text-[#E1A72C] transition-colors flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
          Dashboard
        </Link>
        <span style={{ color: 'var(--text-muted)' }}>/</span>
        <Link to={`/servers/${id}`} className="hover:text-[#E1A72C] transition-colors" style={{ color: 'var(--text-secondary)' }}>
          {server.name}
        </Link>
        <span style={{ color: 'var(--text-muted)' }}>/</span>
        <span style={{ color: 'var(--text-primary)' }}>Editar</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E1A72C]/20 to-[#E1A72C]/5 border border-[#E1A72C]/20 flex items-center justify-center">
          <svg className="w-5 h-5 text-[#E1A72C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
        </div>
        <div>
          <h1 className="text-[22px] font-semibold" style={{ color: 'var(--text-primary)' }}>Editar servidor</h1>
          <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>Configuracion de {server.name}</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {/* Alerts */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-[14px] mb-4 animate-shake flex items-center gap-2.5">
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <span className="font-medium">{error}</span>
          </div>
        )}
        {saved && (
          <div className="bg-green-400/10 border border-green-400/30 text-green-400 px-4 py-3 rounded-lg text-[14px] mb-4 animate-fade-in flex items-center gap-2.5">
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Servidor actualizado correctamente</span>
          </div>
        )}

        {/* General info */}
        <div className="card-static overflow-hidden mb-4">
          <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
            <svg className="w-4 h-4 text-[#E1A72C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />
            </svg>
            <span className="text-[15px] font-medium" style={{ color: 'var(--text-primary)' }}>Informacion general</span>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-[13px] font-medium mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Nombre</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Mi Servidor" className={inputClass} required />
            </div>

            <div>
              <label className="block text-[13px] font-medium mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Tipo de check</label>
              <div className="flex gap-2">
                {checkTypes.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setCheckType(t.value)}
                    className={`flex-1 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-all ${
                      checkType === t.value
                        ? 'bg-gradient-to-r from-[#E1A72C] to-[#C98B1E] text-white shadow-sm shadow-[#E1A72C]/20'
                        : 'bg-[var(--bg-input)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] hover:border-[var(--border-hover)]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                {checkType === 'http' ? 'URL' : checkType === 'tcp' ? 'Host:Puerto' : 'Host / IP'}
              </label>
              <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder={currentType.placeholder} className={inputClass} required />
              <p className="text-[12px] mt-1.5" style={{ color: 'var(--text-muted)' }}>{currentType.hint}</p>
            </div>
          </div>
        </div>

        {/* Monitoring config */}
        <div className="card-static overflow-hidden mb-4">
          <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
            <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
            <span className="text-[15px] font-medium" style={{ color: 'var(--text-primary)' }}>Configuracion de monitoreo</span>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-medium mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Intervalo (segundos)</label>
                <input type="number" value={intervalSec} onChange={(e) => setIntervalSec(Number(e.target.value))} min={10} max={3600} className={inputClass} />
                <p className="text-[12px] mt-1.5" style={{ color: 'var(--text-muted)' }}>Cada cuanto se verifica</p>
              </div>
              <div>
                <label className="block text-[13px] font-medium mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Umbral degradado (ms)</label>
                <input type="number" value={degradedThresholdMs} onChange={(e) => setDegradedThresholdMs(Number(e.target.value))} min={100} max={30000} step={100} className={inputClass} />
                <p className="text-[12px] mt-1.5" style={{ color: 'var(--text-muted)' }}>Si responde mas lento, se marca degradado</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="rounded bg-[var(--bg-input)] border-[var(--border)] text-[#E1A72C] focus:ring-[#E1A72C]" />
                <div>
                  <span className="text-[14px] group-hover:text-[var(--text-primary)] transition-colors" style={{ color: 'var(--text-secondary)' }}>Visible en pagina de status publica</span>
                </div>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="rounded bg-[var(--bg-input)] border-[var(--border)] text-[#E1A72C] focus:ring-[#E1A72C]" />
                <div>
                  <span className="text-[14px] group-hover:text-[var(--text-primary)] transition-colors" style={{ color: 'var(--text-secondary)' }}>Monitoreo activo</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleDelete}
            className="text-[14px] text-red-400/70 hover:text-red-400 transition-colors flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-red-400/5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
            Eliminar servidor
          </button>

          <div className="flex items-center gap-3">
            <Link
              to={`/servers/${id}`}
              className="px-4 py-2.5 text-[14px] rounded-lg transition-all border"
              style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-gradient-to-r from-[#E1A72C] to-[#C98B1E] hover:from-[#C98B1E] hover:to-[#B07819] disabled:opacity-50 text-white text-[14px] font-medium rounded-lg transition-all shadow-md shadow-[#E1A72C]/20 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Guardar cambios
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
