import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { Login } from './pages/Login';
import { DrawingsDashboard } from './pages/DrawingsDashboard';
import { useAuth } from './hooks/useAuth';
import { LogOut, User, Cpu } from 'lucide-react';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, user, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-cyan border-t-transparent rounded-full animate-spin" />
          <p className="text-brand-gray text-sm tracking-wider font-semibold">VALIDATING SESSION...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col">
      {/* Header bar */}
      <header className="glass-panel border-b border-brand-border py-4 px-6 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-brand shadow-md shadow-cyan-500/10">
              <Cpu className="w-5 h-5 text-black" />
            </div>
            <div>
              <span className="font-extrabold tracking-wider text-white font-sans text-lg">
                INTELLI<span className="text-brand-cyan">CAM</span>
              </span>
              <span className="text-[10px] text-brand-cyan block tracking-widest leading-none">AI PLANNING CONSOLE</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* User profile capsule */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-brand-border text-xs">
              <User className="w-4 h-4 text-brand-cyan" />
              <span className="text-white font-medium">{user.username}</span>
              <span className="text-brand-gray px-1.5 py-0.5 rounded-md bg-white/5 uppercase text-[9px] font-bold">{user.role}</span>
            </div>

            {/* Logout button */}
            <button
              onClick={logout}
              className="flex items-center justify-center p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all"
              title="Logout session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">
        <DrawingsDashboard />
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
