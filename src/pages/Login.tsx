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
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: '#212121' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4" style={{ background: '#C9A24B', color: '#212121' }}>T</div>
          <h1 className="text-2xl font-semibold text-white">Tipu</h1>
          <p className="text-sm text-white/40 mt-1">Your personal AI companion</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-6" style={{ background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.1)' }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl text-sm" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#F87171' }}>
                {error}
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-xs text-white/40 mb-1.5 font-medium">Email</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email"
                className="w-full px-3 py-2.5 text-sm rounded-xl text-white placeholder:text-white/25 focus:outline-none transition-colors"
                style={{ background: '#212121', border: '1px solid rgba(255,255,255,0.12)' }}
                placeholder="you@example.com" disabled={loading} />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs text-white/40 mb-1.5 font-medium">Password</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                className="w-full px-3 py-2.5 text-sm rounded-xl text-white placeholder:text-white/25 focus:outline-none transition-colors"
                style={{ background: '#212121', border: '1px solid rgba(255,255,255,0.12)' }}
                placeholder="••••••••" disabled={loading} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 px-6 text-sm font-medium text-[#212121] rounded-xl transition-all disabled:opacity-50 active:scale-[0.98]"
              style={{ background: '#C9A24B' }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-[#212121] border-t-transparent rounded-full animate-spin" />
                  Please wait...
                </span>
              ) : (isSignUp ? 'Create account' : 'Login')}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-white/40">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button type="button" onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
              className="text-[#C9A24B] hover:text-[#E8CE8C] font-medium transition-colors">
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
