import React, { useState } from 'react';
import { usePrepStore } from '../context/PrepContext';
import { Lock, User, Sparkles, BookOpen, AlertCircle } from 'lucide-react';

export const LoginScreen = ({ onLoginSuccess }) => {
  const { state } = usePrepStore();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const API_URL = window.location.origin.includes('5173')
    ? 'http://localhost:5001'
    : window.location.origin;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required.');
      return;
    }

    if (username.trim().length > 50) {
      setError('Username must be 50 characters or fewer.');
      return;
    }

    if (password.trim().length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (isRegister && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim()
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed.');
      }

      // Save token and user details to localStorage/context
      localStorage.setItem('prephq_jwt_token', data.token);
      localStorage.setItem('prephq_auth_user', JSON.stringify(data.user));
      
      onLoginSuccess(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-[999] flex items-center justify-center p-4 min-h-screen overflow-y-auto transition-colors duration-200 ${
      state.theme === 'dark'
        ? 'bg-[#0d1117] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/30 via-slate-950 to-slate-950'
        : 'bg-[#f8fafc] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100/50 via-slate-50 to-slate-50'
    }`}>
      {/* Decorative Blur Spheres */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />

      {/* Glassmorphic Login Card */}
      <div className="w-full max-w-md transform overflow-hidden rounded-3xl border border-slate-200/50 dark:border-slate-800/40 bg-white/70 dark:bg-slate-950/60 backdrop-blur-xl p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.15)] transition-all animate-fade-in relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500 text-white shadow-[0_8px_30px_rgba(99,102,241,0.3)] mb-4 animate-pulse-ring">
            <BookOpen className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
            <span>PrepHQ Workstation</span>
            <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
          </h2>
          <p className="mt-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            {isRegister ? 'Create User Profile' : 'Secure Session Login'}
          </p>
        </div>

        {/* Action Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2.5 p-3 rounded-2xl border border-rose-500/10 bg-rose-500/5 text-rose-500 text-xs font-bold leading-relaxed animate-fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Username Input */}
          <div>
            <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5 ml-1">
              Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 dark:text-slate-600">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                disabled={loading}
                placeholder="E.g., alex_dev"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`w-full text-sm font-semibold rounded-2xl border pl-10 pr-4 py-3 outline-none transition-all duration-150 ${
                  state.theme === 'dark'
                    ? 'bg-slate-900/60 border-slate-800 focus:border-indigo-500 focus:bg-slate-900'
                    : 'bg-slate-500/5 border-slate-200 focus:bg-white focus:border-indigo-500'
                }`}
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5 ml-1">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 dark:text-slate-600">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                disabled={loading}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full text-sm font-semibold rounded-2xl border pl-10 pr-4 py-3 outline-none transition-all duration-150 ${
                  state.theme === 'dark'
                    ? 'bg-slate-900/60 border-slate-800 focus:border-indigo-500 focus:bg-slate-900'
                    : 'bg-slate-500/5 border-slate-200 focus:bg-white focus:border-indigo-500'
                }`}
              />
            </div>
          </div>

          {/* Confirm Password (only on Register) */}
          {isRegister && (
            <div className="animate-fade-in">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5 ml-1">
                Confirm Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 dark:text-slate-600">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required={isRegister}
                  disabled={loading}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full text-sm font-semibold rounded-2xl border pl-10 pr-4 py-3 outline-none transition-all duration-150 ${
                    state.theme === 'dark'
                      ? 'bg-slate-900/60 border-slate-800 focus:border-indigo-500 focus:bg-slate-900'
                      : 'bg-slate-500/5 border-slate-200 focus:bg-white focus:border-indigo-500'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm tracking-wide shadow-[0_8px_30px_rgba(99,102,241,0.25)] hover:shadow-[0_8px_30px_rgba(99,102,241,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none hover:-translate-y-0.5"
          >
            {loading ? (
              <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>{isRegister ? 'Register' : 'Authorize & Start'}</span>
            )}
          </button>
        </form>

        {/* Card Footer Toggle Switch */}
        <div className="mt-8 text-center text-xs font-semibold text-slate-400">
          <span>{isRegister ? 'Already registered?' : 'First time deploying?'}</span>
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
            className="ml-1.5 text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-extrabold focus:outline-none"
          >
            {isRegister ? 'Log in now' : 'Create profile'}
          </button>
        </div>
      </div>
    </div>
  );
};
export default LoginScreen;
