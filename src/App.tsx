import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Chat } from './pages/Chat';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-gradient">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  return user ? <Chat /> : <Login />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;