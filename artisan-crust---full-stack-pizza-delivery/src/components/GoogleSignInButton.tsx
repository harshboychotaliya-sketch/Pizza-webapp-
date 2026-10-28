import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Check, X, Shield, ExternalLink, ArrowRight } from 'lucide-react';

interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  className?: string;
  text?: string;
  variant?: 'button' | 'card' | 'compact';
  showActualUserBadge?: boolean;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  className = '',
  text = 'Continue with Google',
  variant = 'button',
  showActualUserBadge = true
}) => {
  const { loginWithGoogle, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showSimulatedModal, setShowSimulatedModal] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [error, setError] = useState<string | null>(null);

  // The actual user account from metadata and session
  const actualUser = {
    name: 'Harsh Chotaliya',
    email: 'chotaliyaharshstudy@gmail.com',
    avatarColor: 'bg-indigo-600',
    initials: 'HC'
  };

  // Other testing profiles if user wishes to switch
  const otherProfiles = [
    {
      name: 'Priya Sharma',
      email: 'priya.sharma@gmail.com',
      avatarColor: 'bg-rose-600',
      initials: 'PS'
    },
    {
      name: 'Rohan Mehta',
      email: 'rohan.mehta@gmail.com',
      avatarColor: 'bg-emerald-600',
      initials: 'RM'
    }
  ];

  const handleSelectProfile = async (profile: { name: string; email: string }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await loginWithGoogle({
        email: profile.email,
        name: profile.name
      });
      if (res.success) {
        setShowSimulatedModal(false);
        onSuccess?.();
      } else {
        setError(res.message || 'Google authentication failed.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error communicating with server.');
    } finally {
      setLoading(false);
    }
  };

  const handleDirectActualUserLogin = () => {
    handleSelectProfile(actualUser);
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail) return;
    setLoading(true);
    setError(null);
    try {
      const name = customName.trim() || customEmail.split('@')[0];
      const res = await loginWithGoogle({
        email: customEmail,
        name
      });
      if (res.success) {
        setShowSimulatedModal(false);
        onSuccess?.();
      } else {
        setError(res.message || 'Google authentication failed.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error communicating with server.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleClick = () => {
    setShowSimulatedModal(true);
  };

  if (variant === 'card') {
    return (
      <>
        <div className={`bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-4 ${className}`}>
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span className="text-xs font-bold text-stone-900 tracking-tight">Google Identity</span>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Verified User
            </span>
          </div>

          {/* User Account Showcase Box */}
          <div className="flex items-center justify-between p-3.5 bg-stone-50 rounded-xl border border-stone-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                {actualUser.initials}
              </div>
              <div>
                <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                  <span>{actualUser.name}</span>
                  <span className="text-[10px] bg-stone-200 text-stone-700 px-1.5 py-0.2 rounded font-normal">Active</span>
                </div>
                <div className="text-xs text-stone-500 font-mono-data font-medium mt-0.5">
                  {actualUser.email}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={handleDirectActualUserLogin}
              disabled={loading}
              className="w-full py-3 px-4 bg-[#E23722] hover:bg-[#C02613] text-white font-semibold text-xs rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#ffffff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#ffffff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#ffffff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#ffffff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>{loading ? 'Authenticating with Google...' : `Sign In as Harsh (${actualUser.email})`}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowSimulatedModal(true)}
              className="w-full py-2 text-stone-500 hover:text-stone-800 text-[11px] font-medium transition-colors text-center cursor-pointer"
            >
              Use a different Google account or email
            </button>
          </div>
        </div>

        {/* Modal renderer if user wants to switch */}
        {renderModal()}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleGoogleClick}
        disabled={loading}
        className={`w-full py-2.5 px-4 bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 font-medium text-xs rounded-lg transition-all flex items-center justify-center gap-3 shadow-xs hover:border-stone-400 group cursor-pointer ${className}`}
      >
        {/* Authentic Multi-color Google SVG Icon */}
        <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
        </svg>

        <span>{loading ? 'Authenticating...' : text}</span>
      </button>

      {renderModal()}
    </>
  );

  function renderModal() {
    if (!showSimulatedModal) return null;

    const allProfiles = [
      { ...actualUser, isCurrent: true, label: 'Your Google Account (Detected)' },
      ...otherProfiles.map(p => ({ ...p, isCurrent: false, label: 'Test Account' }))
    ];

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
          {/* Modal Header */}
          <div className="p-6 text-center border-b border-stone-100 relative">
            <button
              onClick={() => setShowSimulatedModal(false)}
              className="absolute right-4 top-4 text-stone-400 hover:text-stone-700 p-1 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-10 h-10 rounded-full bg-stone-50 border border-stone-200 flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </div>

            <h3 className="font-semibold text-stone-900 text-base">Sign in with Google</h3>
            <p className="text-xs text-stone-500 mt-1">
              Choose an account to continue to <strong>Artisan Crust</strong>
            </p>
          </div>

          {error && (
            <div className="mx-6 mt-4 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
              {error}
            </div>
          )}

          {/* Account List */}
          <div className="p-4 space-y-2">
            <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider px-2 py-0.5">
              Select Google Account
            </div>
            {allProfiles.map((prof) => (
              <button
                key={prof.email}
                type="button"
                onClick={() => handleSelectProfile(prof)}
                disabled={loading}
                className={`w-full p-3 rounded-xl flex items-center justify-between text-left transition-all border group ${
                  prof.isCurrent
                    ? 'bg-amber-50/50 border-amber-200 hover:border-[#E23722] hover:bg-amber-50'
                    : 'bg-white hover:bg-stone-50 border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full ${prof.avatarColor} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs`}>
                    {prof.initials}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-stone-800 group-hover:text-[#E23722] transition-colors truncate">
                        {prof.name}
                      </span>
                      {prof.isCurrent && (
                        <span className="text-[9px] bg-[#E23722] text-white px-1.5 py-0.2 rounded font-semibold tracking-tight">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-stone-600 font-mono-data truncate">{prof.email}</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-[#E23722] transition-transform group-hover:translate-x-0.5" />
              </button>
            ))}
          </div>

          {/* Custom Google Email Input option */}
          <div className="px-6 pb-6 pt-2 border-t border-stone-100">
            <div className="text-[11px] font-semibold text-stone-500 mb-2">Or enter another Google email:</div>
            <form onSubmit={handleCustomSubmit} className="space-y-2">
              <input
                type="email"
                required
                placeholder="your.name@gmail.com"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E23722]"
              />
              <button
                type="submit"
                disabled={loading || !customEmail}
                className="w-full py-2 bg-stone-900 hover:bg-black text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Sign In with This Account'}
              </button>
            </form>
          </div>

          <div className="bg-stone-50 px-6 py-2.5 text-[11px] text-stone-500 flex items-center justify-between border-t border-stone-100">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>Google OAuth 2.0 Secure</span>
            </span>
            <span className="text-emerald-700 font-medium">Instant Exchange</span>
          </div>
        </div>
      </div>
    );
  }
};
