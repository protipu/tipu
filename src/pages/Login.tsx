import { useState, useRef, type FormEvent, type MouseEvent } from 'react';
import { useAuth } from '../context/AuthContext';

function FloatingOrbs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-[120px]" style={{ background: 'rgba(201,162,75,0.15)' }} />
      <div className="absolute top-1/3 -right-24 w-80 h-80 rounded-full blur-[100px]" style={{ background: 'rgba(232,206,140,0.08)' }} />
      <div className="absolute -bottom-20 left-1/4 w-72 h-72 rounded-full blur-[80px]" style={{ background: 'rgba(201,162,75,0.06)' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-[rgba(201,162,75,0.16)] animate-spin" style={{ animationDuration: '60s' }} />
    </div>
  );
}

export function Login() {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -6;
    const rotateY = ((x - centerX) / centerX) * 6;
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1.01)`;
  };

  const handleMouseLeave = () => {
    if (cardRef.current) {
      cardRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = isSignUp
      ? await signUp(email, password)
      : await signIn(email, password);
    if (result.error) setError(result.error.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative" style={{ background: 'linear-gradient(180deg, #0A0D16 0%, #0D1117 50%, #111827 100%)' }}>
      <FloatingOrbs />

      <div className="w-full max-w-sm relative z-10 animate-scale-in">
        <div className="text-center mb-8 animate-slide-down">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-5 rounded-full text-[#0A0D16] text-3xl font-bold"
            style={{
              background: 'radial-gradient(circle at 30% 25%, #E8CE8C, #C9A24B 60%, #8a6b28 100%)',
              fontFamily: 'var(--font-serif)',
              boxShadow: '0 0 30px rgba(201,162,75,0.3)',
              animation: 'glow-pulse 3s ease-in-out infinite',
            }}
          >
            T
          </div>
          <h1 className="text-4xl font-bold mb-1" style={{ fontFamily: 'var(--font-serif)', color: '#E8CE8C' }}>Tipu</h1>
          <p className="text-sm" style={{ color: '#8891A8' }}>Your personal AI companion</p>
        </div>

        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="rounded-3xl p-7"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,162,75,0.16)', boxShadow: '0 8px 32px rgb(0 0 0 / 0.3)', transition: 'transform 0.15s ease-out, box-shadow 0.3s ease' }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl text-sm animate-slide-down" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#F87171' }}>
                {error}
              </div>
            )}

            <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <label htmlFor="email" className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#8891A8' }}>
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 text-sm transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(201,162,75,0.16)', color: '#EDE9DE', ['--tw-ring-color' as string]: 'rgba(201,162,75,0.4)' }}
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>

            <div className="animate-slide-up" style={{ animationDelay: '0.15s' }}>
              <label htmlFor="password" className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#8891A8' }}>
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 text-sm transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(201,162,75,0.16)', color: '#EDE9DE', ['--tw-ring-color' as string]: 'rgba(201,162,75,0.4)' }}
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 text-[#0A0D16] font-semibold rounded-xl focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                style={{ background: 'linear-gradient(160deg, #E8CE8C, #C9A24B)', boxShadow: '0 0 20px rgba(201,162,75,0.3)', ['--tw-ring-color' as string]: 'rgba(201,162,75,0.4)' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-[#0A0D16] border-t-transparent rounded-full animate-spin" />
                    Please wait...
                  </span>
                ) : (
                  isSignUp ? 'Create account' : 'Login'
                )}
              </button>
            </div>
          </form>

          <p className="mt-5 text-center text-sm" style={{ color: '#8891A8' }}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
              className="font-semibold transition-colors"
              style={{ color: '#C9A24B' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#E8CE8C'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#C9A24B'}
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>

        <p className="mt-6 text-center text-xs animate-fade-in" style={{ color: '#5B6178', animationDelay: '0.4s' }}>
          Your personal AI companion
        </p>
      </div>
    </div>
  );
}
