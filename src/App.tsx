import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Chat } from './pages/Chat';
import { ErrorBoundary } from './components/ErrorBoundary';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#212121' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-white/40 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return user ? <Chat /> : <Login />;
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;