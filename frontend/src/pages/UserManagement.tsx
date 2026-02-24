import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import type { User } from '../types';

export function UserManagement() {
  const { isAdmin, user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'viewer' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAdmin) {
      api.get<User[]>('/users').then(({ data }) => setUsers(data));
    }
  }, [isAdmin]);

  if (!isAdmin) return <Navigate to="/" replace />;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post<User>('/users', form);
      setUsers((prev) => [data, ...prev]);
      setShowForm(false);
      setForm({ email: '', password: '', name: '', role: 'viewer' });
    } catch {
      setError('Error al crear usuario');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar este usuario?')) return;
    await api.delete(`/users/${id}`);
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const handleRoleChange = async (id: string, newRole: string) => {
    const { data } = await api.patch<User>(`/users/${id}`, { role: newRole });
    setUsers((prev) => prev.map((u) => (u.id === id ? data : u)));
  };

  const inputClass = "bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-[14px] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#E1A72C] transition-all";

  const adminCount = users.filter(u => u.role === 'admin').length;
  const viewerCount = users.filter(u => u.role === 'viewer').length;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E1A72C]/20 to-[#E1A72C]/5 border border-[#E1A72C]/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-[#E1A72C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-[22px] font-semibold" style={{ color: 'var(--text-primary)' }}>Usuarios</h1>
            <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>Gestion de accesos al sistema</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2.5 bg-gradient-to-r from-[#E1A72C] to-[#C98B1E] hover:from-[#C98B1E] hover:to-[#B07819] text-white text-[14px] font-medium rounded-lg transition-all shadow-md shadow-[#E1A72C]/20 hover:shadow-lg hover:shadow-[#E1A72C]/30 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
          </svg>
          Crear usuario
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card-static p-4 animate-fade-in stagger-1">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#E1A72C]/10 flex items-center justify-center">
              <svg className="w-4.5 h-4.5 text-[#E1A72C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <div>
              <div className="text-[12px] uppercase tracking-wider font-medium" style={{ color: 'var(--text-muted)' }}>Total usuarios</div>
              <div className="text-[20px] font-bold" style={{ color: 'var(--text-primary)' }}>{users.length}</div>
            </div>
          </div>
        </div>
        <div className="card-static p-4 animate-fade-in stagger-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-400/10 flex items-center justify-center">
              <svg className="w-4.5 h-4.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <div>
              <div className="text-[12px] uppercase tracking-wider font-medium" style={{ color: 'var(--text-muted)' }}>Administradores</div>
              <div className="text-[20px] font-bold text-[#E1A72C]">{adminCount}</div>
            </div>
          </div>
        </div>
        <div className="card-static p-4 animate-fade-in stagger-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-400/10 flex items-center justify-center">
              <svg className="w-4.5 h-4.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <div className="text-[12px] uppercase tracking-wider font-medium" style={{ color: 'var(--text-muted)' }}>Viewers</div>
              <div className="text-[20px] font-bold" style={{ color: 'var(--text-primary)' }}>{viewerCount}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="card-static mb-4 overflow-hidden animate-slide-down">
          <div className="px-5 py-3 border-b border-[var(--border)] flex items-center gap-2">
            <svg className="w-4 h-4 text-[#E1A72C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
            </svg>
            <h2 className="text-[15px] font-medium" style={{ color: 'var(--text-primary)' }}>Nuevo usuario</h2>
          </div>
          <div className="p-5">
            {error && (
              <div className="bg-red-400/10 border border-red-400/20 text-red-400 px-3 py-2 rounded-lg text-[14px] mb-4 animate-fade-in flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                {error}
              </div>
            )}
            <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-medium mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Nombre</label>
                <input type="text" placeholder="Nombre completo" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass + ' w-full'} required />
              </div>
              <div>
                <label className="block text-[12px] font-medium mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Email</label>
                <input type="email" placeholder="usuario@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass + ' w-full'} required />
              </div>
              <div>
                <label className="block text-[12px] font-medium mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Password</label>
                <input type="password" placeholder="Minimo 6 caracteres" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputClass + ' w-full'} required />
              </div>
              <div>
                <label className="block text-[12px] font-medium mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Rol</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={inputClass + ' w-full'}>
                  <option value="viewer">Viewer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="col-span-2 flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-[14px] rounded-lg transition-all border" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2 bg-gradient-to-r from-[#E1A72C] to-[#C98B1E] hover:from-[#C98B1E] hover:to-[#B07819] text-white text-[14px] font-medium rounded-lg transition-all shadow-sm shadow-[#E1A72C]/15">
                  Crear usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users list */}
      <div className="card-static overflow-hidden">
        <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            <span className="text-[14px] font-medium" style={{ color: 'var(--text-primary)' }}>Listado</span>
          </div>
          <span className="text-[13px] px-2.5 py-0.5 rounded-full" style={{ color: 'var(--text-muted)', background: 'var(--bg-input)' }}>{users.length} usuarios</span>
        </div>

        {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 rounded-xl bg-[#E1A72C]/10 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-[#E1A72C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
              </svg>
            </div>
            <span className="text-[14px] font-medium" style={{ color: 'var(--text-primary)' }}>Sin usuarios</span>
            <span className="text-[13px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Crea el primer usuario para comenzar</span>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {users.map((user) => {
              const isSelf = user.id === currentUser?.id;
              return (
                <div key={user.id} className="px-5 py-4 flex items-center gap-4 table-row-hover transition-colors">
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[15px] font-bold uppercase shrink-0 ${
                    user.role === 'admin'
                      ? 'bg-gradient-to-br from-[#E1A72C]/20 to-[#E1A72C]/5 text-[#E1A72C] border border-[#E1A72C]/20'
                      : 'bg-blue-400/10 text-blue-400 border border-blue-400/20'
                  }`}>
                    {user.name?.charAt(0) ?? '?'}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-medium" style={{ color: 'var(--text-primary)' }}>{user.name}</span>
                      {isSelf && (
                        <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-[#E1A72C]/10 text-[#E1A72C] font-medium">Tu</span>
                      )}
                    </div>
                    <div className="text-[13px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{user.email}</div>
                  </div>

                  {/* Role */}
                  <div className="shrink-0">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      disabled={isSelf}
                      className={`bg-[var(--bg-input)] border rounded-lg px-3 py-1.5 text-[13px] disabled:opacity-50 focus:outline-none focus:border-[#E1A72C] transition-all font-medium ${
                        user.role === 'admin' ? 'text-[#E1A72C] border-[#E1A72C]/30' : 'text-blue-400 border-blue-400/30'
                      }`}
                    >
                      <option value="viewer">Viewer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  {/* Actions */}
                  <div className="shrink-0 w-20 flex justify-end">
                    {!isSelf ? (
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-[13px] text-red-400/60 hover:text-red-400 transition-colors flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-red-400/5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                        Eliminar
                      </button>
                    ) : (
                      <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
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
