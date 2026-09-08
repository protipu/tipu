import { useState, useRef, type FormEvent, type MouseEvent } from 'react';
import { useAuth } from '../context/AuthContext';

function FloatingOrbs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/20 blur-[120px] animate-float" />
      <div className="absolute top-1/3 -right-24 w-80 h-80 rounded-full bg-purple-500/15 blur-[100px] animate-float-reverse" />
      <div className="absolute -bottom-20 left-1/4 w-72 h-72 rounded-full bg-indigo-400/10 blur-[80px] animate-float-slow" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-primary/5 animate-spin-slow" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-purple-400/5 animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '30s' }} />
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
    <div className="min-h-screen flex items-center justify-center p-4 relative" style={{ background: 'var(--gradient-bg)' }}>
      <FloatingOrbs />

      <div className="w-full max-w-sm relative z-10 animate-scale-in">
        <div className="text-center mb-8 animate-slide-down">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-5 rounded-2xl bg-primary-gradient text-white text-3xl font-bold shadow-glow animate-glow-pulse" style={{ transformStyle: 'preserve-3d' }}>
            T
          </div>
          <h1 className="text-4xl font-bold text-gradient mb-1">Tipu</h1>
          <p className="text-text-muted text-sm">Your personal AI companion</p>
        </div>

        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="glass-strong rounded-3xl p-7 transition-smooth"
          style={{ transition: 'transform 0.15s ease-out, box-shadow 0.3s ease' }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-error text-sm animate-slide-down">
                {error}
              </div>
            )}

            <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <label htmlFor="email" className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-3 text-text bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-smooth placeholder:text-text-dim text-sm"
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>

            <div className="animate-slide-up" style={{ animationDelay: '0.15s' }}>
              <label htmlFor="password" className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                className="w-full px-4 py-3 text-text bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-smooth placeholder:text-text-dim text-sm"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 bg-primary-gradient text-white font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-smooth shadow-glow hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Please wait...
                  </span>
                ) : (
                  isSignUp ? 'Create account' : 'Login'
                )}
              </button>
            </div>
          </form>

          <p className="mt-5 text-center text-sm text-text-muted">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
              className="text-primary hover:text-primary-hover font-semibold transition-smooth"
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-text-dim animate-fade-in" style={{ animationDelay: '0.4s' }}>
          Your personal AI companion
        </p>
      </div>
    </div>
  );
}
