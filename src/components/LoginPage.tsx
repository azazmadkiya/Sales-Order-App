import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  ArrowRight,
  Smartphone,
  Download
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { InstallAppModal } from './InstallAppModal';
import { usePwaInstall } from '../hooks/usePwaInstall';

export const LoginPage: React.FC = () => {
  const { loginUser, loading } = useAuth();
  const { isInstalled } = usePwaInstall();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim()) {
      setErrorMessage('Please enter your Username or Login ID.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your Password.');
      return;
    }

    setIsSubmitting(true);
    const result = await loginUser(username, password, rememberMe);
    setIsSubmitting(false);

    if (!result.success && result.error) {
      setErrorMessage(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-blue-600 selection:text-white">
      {/* Background Subtle Grid Texture */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      
      {/* Top Banner Branding */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 shadow-lg shadow-blue-500/20 text-white font-black text-xl mb-4 border border-blue-400/30">
          SOA
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Sales Order App
        </h1>
        <p className="mt-1 text-sm text-slate-400 font-medium">
          Sales Order, Dispatch & Invoicing System
        </p>
      </div>

      {/* Main Login Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
          
          {/* Header Zone */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
                <span>Account Login</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Sign in with your assigned staff or admin account
              </p>
            </div>
            <span className="px-2.5 py-1 text-[10px] font-bold text-blue-300 bg-blue-950/60 border border-blue-800/60 rounded-full tracking-wide">
              SECURE
            </span>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-rose-950/70 border border-rose-800 rounded-xl flex items-start space-x-2.5 text-rose-200 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Username */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Username / Login ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your Username / Login ID"
                  autoComplete="username"
                  required
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Password / PIN
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your Password / PIN"
                  autoComplete="current-password"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
                />
                <span className="text-xs text-slate-300 font-medium">Remember on this device</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-semibold text-sm shadow-md transition-all flex items-center justify-center space-x-2 group cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
            {/* Install Android App Shortcut Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsInstallModalOpen(true)}
                className="w-full py-2.5 px-3 bg-gradient-to-r from-blue-950/80 to-indigo-950/80 hover:from-blue-900 hover:to-indigo-900 border border-blue-700/60 rounded-xl text-blue-200 text-xs font-semibold flex items-center justify-center space-x-2 transition-all active:scale-98 shadow-sm cursor-pointer"
              >
                <Smartphone className="w-4 h-4 text-blue-400" />
                <span>📲 Install & Create Shortcut (Android App)</span>
              </button>
            </div>
          </form>

          {/* Notice */}
          <div className="mt-5 text-center border-t border-slate-800/80 pt-4">
            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
              🔒 Admin can add team users and grant specific rights inside the portal.
            </p>
          </div>
        </div>

        {/* Install Modal */}
        <InstallAppModal
          isOpen={isInstallModalOpen}
          onClose={() => setIsInstallModalOpen(false)}
        />

        {/* Designer Credits */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500 font-medium tracking-wide">
            Design By <span className="text-slate-300 font-semibold">Azazmadkiya</span>
          </p>
        </div>
      </div>
    </div>
  );
};
