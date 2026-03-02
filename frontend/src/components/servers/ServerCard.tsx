import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { StatusBadge } from './StatusBadge';
import { ServerForm } from './ServerForm';
import { UptimeBar } from '../checks/UptimeBar';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import type { Server } from '../../types';

const statusColors: Record<string, string> = {
  up: '#4ade80',
  down: '#f87171',
  degraded: '#facc15',
};

export function ServerCard({ server }: { server: Server }) {
  const { isAdmin } = useAuth();
  const [editing, setEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/servers/${server.id}`);
      setShowDeleteModal(false);
    } catch {
      setDeleting(false);
    }
  };

  const topColor = statusColors[server.status] ?? '#546b8a';

  return (
    <>
      <div className="card overflow-hidden flex flex-col group">
        {/* Color status bar */}
        <div className="h-[3px]" style={{ background: `linear-gradient(to right, ${topColor}, ${topColor}80)` }} />

        {/* Header */}
        <div className="px-4 pt-4 pb-3 flex items-start justify-between">
          <StatusBadge status={server.status} size="lg" />
          <div className="flex items-center gap-1.5">
            {server.isPublic && (
              <span className="text-[11px] bg-[#E1A72C]/10 text-[#E1A72C] px-1.5 py-0.5 rounded flex items-center gap-1" title="Visible en página de status">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.64 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.64 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Status
              </span>
            )}
            {!server.enabled && (
              <span className="text-[12px] bg-yellow-400/10 text-yellow-400 px-1.5 py-0.5 rounded">Pausado</span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="px-4 pb-3 flex-1">
          <Link
            to={`/servers/${server.id}`}
            className="text-[16px] font-medium hover:text-[#E1A72C] transition-colors block"
            style={{ color: 'var(--text-primary)' }}
          >
            {server.name}
          </Link>
          <p className="text-[13px] mt-1 truncate" style={{ color: 'var(--text-muted)' }}>{server.url}</p>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <span className="text-[12px] px-1.5 py-0.5 rounded uppercase font-medium" style={{ color: 'var(--text-secondary)', background: 'var(--bg-input)' }}>
              {server.checkType}
            </span>
            <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>cada {server.intervalSec}s</span>
          </div>
          <UptimeBar serverId={server.id} />
        </div>

        {/* Admin actions */}
        {isAdmin && (
          <div className="px-4 py-2.5 border-t flex items-center justify-end gap-3 opacity-60 group-hover:opacity-100 transition-opacity" style={{ borderColor: 'var(--border)' }}>
            <button
              onClick={() => setEditing(true)}
              className="text-[13px] hover:text-[#E1A72C] transition-colors flex items-center gap-1"
              style={{ color: 'var(--text-secondary)' }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              Editar
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="text-[13px] hover:text-red-400 transition-colors flex items-center gap-1"
              style={{ color: 'var(--text-secondary)' }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
              Eliminar
            </button>
          </div>
        )}
      </div>
      {editing && <ServerForm server={server} onClose={() => setEditing(false)} />}

      {/* Delete confirmation modal */}
      {showDeleteModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !deleting && setShowDeleteModal(false)} />
          <div
            className="relative w-full max-w-md card-static rounded-xl p-6 animate-fade-in-scale"
            style={{ boxShadow: '0 16px 64px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(42, 63, 84, 0.3)' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <h3 className="text-[16px] font-semibold" style={{ color: 'var(--text-primary)' }}>Eliminar servidor</h3>
                <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>{server.name}</p>
              </div>
            </div>
            <p className="text-[14px] mb-6" style={{ color: 'var(--text-secondary)' }}>
              Esta accion es irreversible. Se eliminaran todos los checks, incidentes y notificaciones asociados a este servidor.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="px-4 py-2 text-[14px] rounded-lg border transition-all disabled:opacity-50"
                style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-[14px] font-medium rounded-lg transition-all flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Eliminando...
                  </>
                ) : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
