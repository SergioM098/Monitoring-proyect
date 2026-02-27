import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import api from '../api/client';
import type { NotificationSetting } from '../types';

export function Settings() {
  const { isAdmin } = useAuth();
  const [emailStatus, setEmailStatus] = useState<string>('checking...');
  const [notifications, setNotifications] = useState<NotificationSetting[]>([]);
  const [newDest, setNewDest] = useState('');
  const [newTrigger, setNewTrigger] = useState('down');

  useEffect(() => {
    api.get('/health').then(({ data }) => {
      setEmailStatus(data.email || 'unknown');
    }).catch(() => setEmailStatus('error'));

    api.get('/notifications').then(({ data }) => setNotifications(data));
  }, []);

  const addNotification = async () => {
    if (!newDest) return;
    const { data } = await api.post('/notifications', { destination: newDest, triggerOn: newTrigger });
    setNotifications((prev) => [data, ...prev]);
    setNewDest('');
  };

  const removeNotification = async (nid: string) => {
    await api.delete(`/notifications/${nid}`);
    setNotifications((prev) => prev.filter((n) => n.id !== nid));
  };

  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-[var(--text-primary)]">Notificaciones</h1>
        <p className="text-[14px] text-[var(--text-muted)] mt-0.5">Configuracion de alertas por correo</p>
      </div>

      <div className="card-static mb-4 overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border)] flex items-center gap-2">
          <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
          <h2 className="text-[15px] font-medium text-[var(--text-primary)]">Estado SMTP</h2>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-3">
            <span className={`w-2.5 h-2.5 rounded-full ${emailStatus === 'connected' ? 'bg-green-400 glow-green' : 'bg-red-400 glow-red'}`} />
            <span className="text-[15px] text-[var(--text-primary)] font-medium">
              {emailStatus === 'connected' ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
          {emailStatus !== 'connected' && (
            <p className="text-[14px] text-[var(--text-muted)] mt-2">
              Configura las variables SMTP_HOST, SMTP_USER y SMTP_PASS en el archivo .env del backend.
            </p>
          )}
        </div>
      </div>

      {/* Global email notifications */}
      <div className="card-static mb-4 overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border)] flex items-center gap-2">
          <svg className="w-4 h-4 text-[#E1A72C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
          <h2 className="text-[15px] font-medium text-[var(--text-primary)]">Correos de alerta</h2>
        </div>
        <div className="p-4">
          <p className="text-[14px] text-[var(--text-muted)] mb-3">
            Los correos configurados aqui recibiran alertas de <strong className="text-[var(--text-secondary)]">todos los servidores</strong>.
          </p>
          <div className="space-y-2 mb-3">
            {notifications.map((n) => (
              <div key={n.id} className="flex items-center justify-between border rounded-lg px-3 py-2.5 transition-colors" style={{ background: 'var(--bg-input)', borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400 glow-green" />
                  <span className="text-[14px]" style={{ color: 'var(--text-primary)' }}>{n.destination}</span>
                  <span className="ml-1 text-[12px] px-1.5 py-0.5 rounded" style={{ color: 'var(--text-muted)', background: 'var(--bg-card)' }}>
                    {n.triggerOn === 'both' ? 'Caido + Lento' : n.triggerOn === 'degraded' ? 'Solo lento' : 'Solo caido'}
                  </span>
                </div>
                <button
                  onClick={() => removeNotification(n.id)}
                  className="text-[13px] text-red-400/70 hover:text-red-400 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            ))}
            {notifications.length === 0 && (
              <p className="text-[14px] py-2" style={{ color: 'var(--text-muted)' }}>Sin alertas configuradas</p>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="email"
              value={newDest}
              onChange={(e) => setNewDest(e.target.value)}
              placeholder="nombre@empresa.com"
              className="flex-1 border rounded-lg px-3 py-1.5 text-[14px] focus:outline-none focus:border-[#E1A72C] transition-all"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
            <select
              value={newTrigger}
              onChange={(e) => setNewTrigger(e.target.value)}
              className="border rounded-lg px-2 py-1.5 text-[14px] focus:outline-none focus:border-[#E1A72C] transition-all"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            >
              <option value="down">Solo caido</option>
              <option value="degraded">Solo lento</option>
              <option value="both">Ambos</option>
            </select>
            <button
              onClick={addNotification}
              className="px-3 py-1.5 bg-gradient-to-r from-[#E1A72C] to-[#C98B1E] hover:from-[#C98B1E] hover:to-[#B07819] text-white text-[14px] font-medium rounded-lg transition-all shadow-sm shadow-[#E1A72C]/15"
            >
              Agregar
            </button>
          </div>
        </div>
      </div>

      <div className="card-static overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border)] flex items-center gap-2">
          <svg className="w-4 h-4 text-[#E1A72C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
          </svg>
          <h2 className="text-[15px] font-medium text-[var(--text-primary)]">Como configurar</h2>
        </div>
        <div className="p-4 space-y-4">
          {[
            ['1', 'Agrega las variables SMTP en tu', '.env', 'del backend (host, user, pass).'],
            ['2', 'Reinicia el backend. Deberia mostrar', '[Email] SMTP conectado', 'en la terminal.'],
            ['3', 'Agrega correos arriba (ej:', 'admin@empresa.com', '). Se aplicaran a todos los servidores.'],
          ].map(([num, text, code, suffix]) => (
            <div key={num} className="flex items-start gap-3 group hover:bg-white/[0.02] -mx-2 px-2 py-1 rounded-lg transition-colors">
              <span className="bg-gradient-to-br from-[#E1A72C] to-[#C98B1E] text-white rounded-full w-6 h-6 flex items-center justify-center text-[12px] font-bold shrink-0 shadow-sm shadow-[#E1A72C]/20">{num}</span>
              <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed">
                {text}
                {code && <code className="bg-[var(--bg-input)] px-1.5 py-0.5 rounded text-[#E1A72C] mx-1 text-[13px]">{code}</code>}
                {suffix}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
