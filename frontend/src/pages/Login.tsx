import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types/auth';
import { Lock, Mail, User, Info, Cpu, Eye, EyeOff, Shield } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, register } = useAuth();
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('engineer');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegistering) {
        if (!email.includes('@')) {
          throw new Error('Please enter a valid email address.');
        }
        await register(username, email, password, role);
        // Switch to login tab and autofill
        setIsRegistering(false);
        setError('Registration successful! Please login with your credentials.');
      } else {
        await login(username, password); // username field is used for username/email
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-4">
      {/* Dynamic Background Glowing Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-cyan opacity-[0.03] blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-brand-blue opacity-[0.03] blur-[120px]" />

      <div className="w-full max-w-md z-10">
        {/* Logo and Brand Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-brand shadow-lg shadow-cyan-500/20 mb-4 animate-pulse">
            <Cpu className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight font-sans text-white mb-2">
            INTELLI<span className="text-gradient font-black">CAM AI</span>
          </h1>
          <p className="text-brand-gray text-sm max-w-xs">
            Autonomous Machining sequence generator and CNC code planner.
          </p>
        </div>

        {/* Auth Glass Card */}
        <div className="glass-panel glass-panel-glow rounded-3xl p-8 border border-brand-border">
          {/* Card Headers */}
          <div className="flex border-b border-brand-border mb-6">
            <button
              type="button"
              className={`flex-1 pb-3 text-sm font-semibold transition-all ${
                !isRegistering
                  ? 'text-brand-cyan border-b-2 border-brand-cyan'
                  : 'text-brand-gray hover:text-white'
              }`}
              onClick={() => {
                setIsRegistering(false);
                setError(null);
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`flex-1 pb-3 text-sm font-semibold transition-all ${
                isRegistering
                  ? 'text-brand-cyan border-b-2 border-brand-cyan'
                  : 'text-brand-gray hover:text-white'
              }`}
              onClick={() => {
                setIsRegistering(true);
                setError(null);
              }}
            >
              Register
            </button>
          </div>

          {/* Feedback/Error Messages */}
          {error && (
            <div className={`p-4 rounded-xl text-xs mb-6 border ${
              error.includes('successful')
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            } flex items-start gap-2`}>
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-gray mb-2">
                Username {!isRegistering && 'or Email'}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-gray">
                  <User className="w-5 h-5" />
                </span>
                <input
                  type="text"
                  required
                  placeholder={isRegistering ? "engineer_joe" : "Username or email"}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-black/40 border border-brand-border rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-brand-gray/60 focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all"
                />
              </div>
            </div>

            {/* Email (Registration Only) */}
            {isRegistering && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-gray mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-gray">
                    <Mail className="w-5 h-5" />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="joe@intellicam.ai"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/40 border border-brand-border rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-brand-gray/60 focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all"
                  />
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-gray mb-2">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-gray">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/40 border border-brand-border rounded-xl py-3 pl-10 pr-10 text-sm text-white placeholder-brand-gray/60 focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-brand-gray hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Role Select (Registration Only) */}
            {isRegistering && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-gray mb-2">
                  System Role
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-gray">
                    <Shield className="w-5 h-5" />
                  </span>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full bg-black/40 border border-brand-border rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all appearance-none"
                  >
                    <option value="engineer" className="bg-brand-dark">Manufacturing Engineer</option>
                    <option value="admin" className="bg-brand-dark">System Administrator</option>
                  </select>
                </div>
              </div>
            )}

            {/* Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-brand text-black font-semibold py-3 px-4 rounded-xl transition-all glow-btn flex items-center justify-center gap-2 mt-4 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : isRegistering ? (
                'Create Account'
              ) : (
                'Sign In to Console'
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-brand-gray/40 mt-8">
          IntelliCAM AI Platform. For authorized laboratory and manufacturing plant use only.
        </p>
      </div>
    </div>
  );
};
