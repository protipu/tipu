import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = isSignUp
      ? await signUp(email, password)
      : await signIn(email, password);

    if (result.error) {
      setError(result.error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-gradient p-4 md:p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-gold shadow-glow mb-6">
            <svg className="w-8 h-8 text-background" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-medium text-text mb-2">Tipu</h1>
          <p className="text-text-muted">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </p>
        </div>

        <div className="glass-card rounded-2xl p-6 md:p-8 shadow-warm">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 rounded-xl bg-error-bg border border-error/30 text-error text-sm animate-slide-up">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-muted mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-5 py-4 text-text bg-background border border-border-light rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-smooth placeholder:text-text-dim"
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-muted mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                className="w-full px-5 py-4 text-text bg-background border border-border-light rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-smooth placeholder:text-text-dim"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-gradient-to-br from-primary via-primary-hover to-primary-muted text-background font-medium rounded-xl hover:from-primary-hover hover:via-primary-hover hover:to-primary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed transition-smooth shadow-warm shadow-glow"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin"></span>
                  Please wait...
                </span>
              ) : (
                isSignUp ? 'Create account' : 'Sign in'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-text-muted">
            {isSignUp ? 'Already have an account?' : 'Need an account?'} {' '}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="text-primary hover:text-primary-hover font-medium transition-smooth"
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>

        <p className="mt-8 text-center text-xs text-text-dim max-w-xs mx-auto">
          Your personal AI companion — warm, friendly, and remembers everything you share.
        </p>
      </div>
    </div>
  );
}