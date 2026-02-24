import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import api from '../api/client';

export function Settings() {
  const { isAdmin } = useAuth();
  const [waStatus, setWaStatus] = useState<string>('checking...');

  useEffect(() => {
    api.get('/health').then(({ data }) => {
      setWaStatus(data.whatsapp || 'unknown');
    }).catch(() => setWaStatus('error'));
  }, []);

  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-[var(--text-primary)]">Notificaciones</h1>
        <p className="text-[14px] text-[var(--text-muted)] mt-0.5">Configuracion de alertas WhatsApp</p>
      </div>

      <div className="card-static mb-4 overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border)] flex items-center gap-2">
          <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
          <h2 className="text-[15px] font-medium text-[var(--text-primary)]">Estado de WhatsApp</h2>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-3">
            <span className={`w-2.5 h-2.5 rounded-full ${waStatus === 'connected' ? 'bg-green-400 glow-green' : 'bg-red-400 glow-red'}`} />
            <span className="text-[15px] text-[var(--text-primary)] font-medium">
              {waStatus === 'connected' ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
          {waStatus !== 'connected' && (
            <p className="text-[14px] text-[var(--text-muted)] mt-2">
              Revisa la terminal del backend para escanear el codigo QR con WhatsApp.
            </p>
          )}
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
            ['1', 'Arranca el backend con', 'npm run dev', 'y revisa la terminal.'],
            ['2', 'Escanea el codigo QR que aparece con tu WhatsApp (Dispositivos vinculados).', '', ''],
            ['3', 'La sesion se guarda localmente. No necesitas escanear de nuevo al reiniciar.', '', ''],
            ['4', 'Ve a la pagina de detalle de un servidor y agrega numeros de WhatsApp (ej:', '521234567890', ').'],
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
