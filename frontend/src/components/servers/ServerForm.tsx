import { useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../../api/client';
import type { Server } from '../../types';

interface Props {
  onClose: () => void;
  server?: Server;
}

const checkTypes = [
  { value: 'http', label: 'HTTP(S)', placeholder: 'https://example.com', hint: 'Verifica que responda con status 2xx/3xx' },
  { value: 'tcp', label: 'TCP Port', placeholder: '192.168.1.1:22', hint: 'Verifica que el puerto este abierto' },
  { value: 'ping', label: 'Ping', placeholder: '192.168.1.1', hint: 'ICMP ping - solo necesita que el servidor este encendido' },
];

export function ServerForm({ onClose, server }: Props) {
  const isEditing = !!server;
  const [name, setName] = useState(server?.name ?? '');
  const [url, setUrl] = useState(server?.url ?? '');
  const [checkType, setCheckType] = useState(server?.checkType ?? 'http');
  const [intervalSec, setIntervalSec] = useState(server?.intervalSec ?? 60);
  const [degradedThresholdMs, setDegradedThresholdMs] = useState(server?.degradedThresholdMs ?? 5000);
  const [isPublic, setIsPublic] = useState(server?.isPublic ?? false);
  const [enabled, setEnabled] = useState(server?.enabled ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentType = checkTypes.find((t) => t.value === checkType)!;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isEditing) {
        await api.patch(`/servers/${server.id}`, { name, url, checkType, intervalSec, degradedThresholdMs, isPublic, enabled });
      } else {
        await api.post('/servers', { name, url, checkType, intervalSec, degradedThresholdMs, isPublic });
      }
      onClose();
    } catch {
      setError(isEditing ? 'Error al actualizar el servidor' : 'Error al crear el servidor');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-[15px] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#E1A72C] transition-all";

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center z-[100] px-4" onClick={onClose}>
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="glass rounded-xl w-full max-w-md relative animate-fade-in-scale max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: '0 16px 64px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(42, 63, 84, 0.3)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-2">
          <svg className="w-4.5 h-4.5 text-[#E1A72C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />
          </svg>
          <h2 className="text-[17px] font-medium text-[var(--text-primary)]">
            {isEditing ? 'Editar servidor' : 'Agregar servidor'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="bg-red-400/10 border border-red-400/20 text-red-400 px-3 py-2 rounded-lg text-[14px] animate-fade-in">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[14px] text-[var(--text-secondary)] mb-1.5">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mi Servidor"
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className="block text-[14px] text-[var(--text-secondary)] mb-1.5">Tipo de check</label>
            <div className="flex gap-2">
              {checkTypes.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => { setCheckType(t.value); if (!isEditing) setUrl(''); }}
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
            <label className="block text-[14px] text-[var(--text-secondary)] mb-1.5">
              {checkType === 'http' ? 'URL' : checkType === 'tcp' ? 'Host:Puerto' : 'Host / IP'}
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={currentType.placeholder}
              className={inputClass}
              required
            />
            <p className="text-[12px] text-[var(--text-muted)] mt-1.5">{currentType.hint}</p>
          </div>

          <div>
            <label className="block text-[14px] text-[var(--text-secondary)] mb-1.5">Intervalo de check (segundos)</label>
            <input
              type="number"
              value={intervalSec}
              onChange={(e) => setIntervalSec(Number(e.target.value))}
              min={10}
              max={3600}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-[14px] text-[var(--text-secondary)] mb-1.5">Umbral degradado (ms)</label>
            <input
              type="number"
              value={degradedThresholdMs}
              onChange={(e) => setDegradedThresholdMs(Number(e.target.value))}
              min={100}
              max={30000}
              step={100}
              className={inputClass}
            />
            <p className="text-[12px] text-[var(--text-muted)] mt-1.5">Si responde mas lento que esto, se marca como degradado</p>
          </div>

          <div className="flex items-center gap-2.5">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="rounded bg-[var(--bg-input)] border-[var(--border)] text-[#E1A72C] focus:ring-[#E1A72C]"
            />
            <label htmlFor="isPublic" className="text-[14px] text-[var(--text-secondary)]">
              Visible en pagina de status publica
            </label>
          </div>

          {isEditing && (
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                id="enabled"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="rounded bg-[var(--bg-input)] border-[var(--border)] text-[#E1A72C] focus:ring-[#E1A72C]"
              />
              <label htmlFor="enabled" className="text-[14px] text-[var(--text-secondary)]">
                Monitoreo activo
              </label>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-[14px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors rounded-lg hover:bg-white/5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-gradient-to-r from-[#E1A72C] to-[#C98B1E] hover:from-[#C98B1E] hover:to-[#B07819] disabled:opacity-50 text-white text-[14px] font-medium rounded-lg transition-all shadow-md shadow-[#E1A72C]/20"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isEditing ? 'Guardando...' : 'Creando...'}
                </span>
              ) : (isEditing ? 'Guardar' : 'Crear')}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
