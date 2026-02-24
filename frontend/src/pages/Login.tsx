import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ParticlePlanet } from '../components/effects/ParticlePlanet';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch {
      setError('Credenciales invalidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 page-bg relative"
    >
      <ParticlePlanet />
      <div className="w-full max-w-sm animate-fade-in relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.svg" alt="WOW Desarrollo Digital" className="h-16 mb-2" />
          <span className="text-[13px] mt-1" style={{ color: 'var(--text-muted)' }}>Panel de monitoreo</span>
        </div>

        {/* Form card */}
        <form
          onSubmit={handleSubmit}
          className="glass rounded-xl p-6 space-y-4"
          style={{ boxShadow: '0 8px 40px rgba(0, 0, 0, 0.4), 0 0 80px rgba(255, 153, 0, 0.05)' }}
        >
          <h2 className="text-[17px] font-medium" style={{ color: 'var(--text-primary)' }}>Iniciar sesion</h2>

          {error && (
            <div className="bg-red-400/10 border border-red-400/20 text-red-400 px-3 py-2 rounded-lg text-[14px] animate-fade-in">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[14px] mb-1.5" style={{ color: 'var(--text-secondary)' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-lg px-3.5 py-2.5 text-[15px] focus:outline-none focus:border-[#E1A72C] transition-all"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              required
            />
          </div>

          <div>
            <label className="block text-[14px] mb-1.5" style={{ color: 'var(--text-secondary)' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-lg px-3.5 py-2.5 text-[15px] focus:outline-none focus:border-[#E1A72C] transition-all"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#E1A72C] to-[#C98B1E] hover:from-[#C98B1E] hover:to-[#B07819] disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-all text-[15px] shadow-md shadow-[#E1A72C]/20 hover:shadow-lg hover:shadow-[#E1A72C]/30"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Entrando...
              </span>
            ) : 'Iniciar sesion'}
          </button>
        </form>
      </div>
    </div>
  );
}
