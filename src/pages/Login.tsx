import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = isSignUp ? await signUp(email, password) : await signIn(email, password);
    if (result.error) setError(result.error.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: 'var(--void)' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4" style={{ background: 'var(--gold)', color: 'var(--void)', fontFamily: 'var(--font-serif)' }}>T</div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text)', fontFamily: 'var(--font-serif)' }}>Tipu</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Your personal AI companion</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-6" style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-strong)' }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl text-sm" style={{ background: 'rgba(212,106,106,0.08)', border: '1px solid rgba(212,106,106,0.2)', color: 'var(--danger)' }}>
                {error}
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-xs mb-1.5 font-medium" style={{ color: 'var(--text-muted)' }}>Email</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email"
                className="w-full px-3 py-2.5 text-sm rounded-xl focus:outline-none transition-colors"
                style={{ background: 'var(--surface)', border: '1px solid var(--border-strong)', color: 'var(--text)' }}
                placeholder="you@example.com" disabled={loading} />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs mb-1.5 font-medium" style={{ color: 'var(--text-muted)' }}>Password</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                className="w-full px-3 py-2.5 text-sm rounded-xl focus:outline-none transition-colors"
                style={{ background: 'var(--surface)', border: '1px solid var(--border-strong)', color: 'var(--text)' }}
                placeholder="••••••••" disabled={loading} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 px-6 text-sm font-medium rounded-xl transition-all disabled:opacity-50 active:scale-[0.98]"
              style={{ background: 'var(--gold)', color: 'var(--void)' }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--void)', borderTopColor: 'transparent' }} />
                  Please wait...
                </span>
              ) : (isSignUp ? 'Create account' : 'Login')}
            </button>
          </form>
          <p className="mt-4 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button type="button" onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
              className="font-medium transition-colors" style={{ color: 'var(--gold)' }}>
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
