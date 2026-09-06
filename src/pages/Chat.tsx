import { useAuth } from '../context/AuthContext';

export function Chat() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-medium text-text">Tipu</h1>
          <button
            onClick={() => signOut()}
            className="px-3 py-1.5 text-sm text-text-muted hover:text-text bg-background-muted rounded-md hover:bg-background border border-border transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full p-4 flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-medium text-text mb-2">Chat coming soon</h2>
            <p className="text-text-muted">
              Signed in as <span className="font-medium">{user?.email}</span>
            </p>
            <p className="text-text-muted mt-4 text-sm">
              Phase 2 will implement the core chat loop with Gemini API
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}