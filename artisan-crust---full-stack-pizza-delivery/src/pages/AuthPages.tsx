import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, User, CheckCircle2, AlertCircle, ArrowRight, Pizza, KeyRound, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { GoogleSignInButton } from '../components/GoogleSignInButton';

// 1. Login Page
export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login, quickLoginAs } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      navigate('/menu');
    } else {
      if (res.needsVerification && res.verificationToken) {
        navigate(`/verify-email?token=${res.verificationToken}&email=${encodeURIComponent(res.email || email)}`);
      } else {
        setError(res.message || 'Login failed.');
      }
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-16 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-[#E23722] text-white flex items-center justify-center mx-auto shadow-md">
          <Pizza className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-display font-bold text-[#242424]">Sign In to Artisan Crust</h1>
        <p className="text-xs text-stone-500">Access your saved custom crusts, live orders, and reward perks</p>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Auth Container */}
      <div className="bg-white p-7 rounded-2xl border border-[#EFEAE4] shadow-sm space-y-5">
        {/* Google One-Click Sign In */}
        <div className="space-y-2">
          <GoogleSignInButton
            onSuccess={() => navigate('/menu')}
            text="Continue with Google"
          />
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-stone-200"></div>
            <span className="flex-shrink mx-3 text-[11px] uppercase tracking-wider text-stone-400 font-semibold">
              or sign in with email
            </span>
            <div className="flex-grow border-t border-stone-200"></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#EFEAE4] rounded-lg text-xs text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#E23722] transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-stone-700">Password</label>
              <Link to="/forgot-password" className="text-[11px] text-[#E23722] hover:underline font-medium">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#EFEAE4] rounded-lg text-xs text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#E23722] transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#E23722] hover:bg-[#C02613] disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>Sign In with Email</span>
            )}
          </button>
        </form>

        {/* Demo shortcuts */}
        <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#EFEAE4] text-xs space-y-1.5 pt-2">
          <div className="font-semibold text-stone-600 text-[11px] uppercase tracking-wider">Fast Demo Accounts:</div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => quickLoginAs('customer')}
              className="px-2.5 py-1 bg-[#E23722] text-white rounded text-[11px] font-semibold hover:bg-[#C02613] transition-colors"
            >
              Demo Customer
            </button>
            <button
              type="button"
              onClick={() => quickLoginAs('admin')}
              className="px-2.5 py-1 bg-stone-800 text-white rounded text-[11px] font-semibold hover:bg-black transition-colors"
            >
              Demo Head Chef (Admin)
            </button>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-stone-500">
        Don't have an account yet?{' '}
        <Link to="/register" className="font-semibold text-[#E23722] hover:underline">
          Register now
        </Link>
      </div>
    </div>
  );
};

// 2. Register Page
export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await register(name, email, password);
    setLoading(false);

    if (res.success) {
      navigate(`/verify-email?token=${res.verificationToken || ''}&email=${encodeURIComponent(email)}&registered=1`);
    } else {
      setError(res.message || 'Registration failed.');
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-16 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-[#E23722] text-white flex items-center justify-center mx-auto shadow-md">
          <Pizza className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-display font-bold text-[#242424]">Create an Account</h1>
        <p className="text-xs text-stone-500">Join Artisan Crust to craft bespoke pizzas and receive live kitchen updates</p>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Registration Container */}
      <div className="bg-white p-7 rounded-2xl border border-[#EFEAE4] shadow-sm space-y-5">
        <div className="space-y-2">
          <GoogleSignInButton
            onSuccess={() => navigate('/menu')}
            text="Sign Up with Google"
          />
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-stone-200"></div>
            <span className="flex-shrink mx-3 text-[11px] uppercase tracking-wider text-stone-400 font-semibold">
              or register with email
            </span>
            <div className="flex-grow border-t border-stone-200"></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Maya Iyer"
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#EFEAE4] rounded-lg text-xs text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#E23722] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="maya@example.com"
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#EFEAE4] rounded-lg text-xs text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#E23722] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Password (min 6 characters)</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#EFEAE4] rounded-lg text-xs text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#E23722] transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#E23722] hover:bg-[#C02613] disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>Create Account & Verify</span>
            )}
          </button>
        </form>
      </div>

      <div className="text-center text-xs text-stone-500">
        Already registered?{' '}
        <Link to="/login" className="font-semibold text-[#E23722] hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
};

// 3. Verify Email Page
export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tokenParam = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || '';

  const [token, setToken] = useState(tokenParam);
  const [email, setEmail] = useState(emailParam);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const { verifyEmail } = useAuth();
  const navigate = useNavigate();

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!token) return;

    setStatus('loading');
    const res = await verifyEmail(token, email);
    if (res.success) {
      setStatus('success');
      setMessage(res.message);
    } else {
      setStatus('error');
      setMessage(res.message);
    }
  };

  useEffect(() => {
    if (tokenParam) {
      handleVerify();
    }
  }, [tokenParam]);

  return (
    <div className="max-w-md mx-auto px-6 py-16 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
          <Shield className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-display font-bold text-[#242424]">Email Verification</h1>
        <p className="text-xs text-stone-500">Verify your token to unlock full ordering and tracking access</p>
      </div>

      {status === 'success' ? (
        <div className="bg-white p-6 rounded-xl border border-[#EFEAE4] text-center space-y-4">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
          <h3 className="font-display font-bold text-lg text-emerald-800">Email Verified Successfully!</h3>
          <p className="text-xs text-stone-600">{message}</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-2.5 bg-[#E23722] hover:bg-[#C02613] text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Go to Login
          </button>
        </div>
      ) : (
        <form onSubmit={handleVerify} className="bg-white p-6 rounded-xl border border-[#EFEAE4] shadow-xs space-y-4">
          {status === 'error' && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Account Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2 bg-white border border-[#EFEAE4] rounded-lg text-xs text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#E23722]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Verification Token</label>
            <input
              type="text"
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste 32-character token here..."
              className="w-full px-3 py-2 bg-white border border-[#EFEAE4] rounded-lg text-xs font-mono-data text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#E23722]"
            />
            <p className="text-[11px] text-stone-400 mt-1">
              Check the <strong>Dev Mailbox</strong> at the top bar to inspect your verification email and token.
            </p>
          </div>

          <button
            type="submit"
            disabled={status === 'loading' || !token}
            className="w-full py-2.5 bg-[#E23722] hover:bg-[#C02613] disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-colors"
          >
            {status === 'loading' ? 'Verifying...' : 'Submit Verification'}
          </button>
        </form>
      )}
    </div>
  );
};

// 4. Forgot Password Page
export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [resetToken, setResetToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await authApi.forgotPassword(email);
      setStatus('success');
      setMessage(res.message);
      if (res.resetToken) {
        setResetToken(res.resetToken);
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Failed to dispatch reset request.');
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-16 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-stone-800 text-white flex items-center justify-center mx-auto shadow-md">
          <KeyRound className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-display font-bold text-[#242424]">Reset Your Password</h1>
        <p className="text-xs text-stone-500">We'll dispatch a secure, expiring token to your registered email</p>
      </div>

      {status === 'success' ? (
        <div className="bg-white p-6 rounded-xl border border-[#EFEAE4] space-y-3">
          <div className="text-emerald-700 text-xs font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>Dispatch Confirmed</span>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">{message}</p>
          {resetToken && (
            <div className="p-3 bg-[#FAF7F2] rounded border border-[#EFEAE4] text-xs font-mono-data break-all">
              <strong>Dev Token:</strong> {resetToken}
            </div>
          )}
          <Link
            to={`/reset-password?email=${encodeURIComponent(email)}&token=${resetToken || ''}`}
            className="block text-center w-full py-2 bg-[#242424] hover:bg-black text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Proceed to Enter New Password →
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-[#EFEAE4] shadow-xs space-y-4">
          {status === 'error' && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Registered Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#EFEAE4] rounded-lg text-xs text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#E23722]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full py-2.5 bg-[#E23722] hover:bg-[#C02613] disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-colors"
          >
            {status === 'loading' ? 'Dispatching...' : 'Send Password Reset Email'}
          </button>
        </form>
      )}

      <div className="text-center text-xs text-stone-500">
        Remember your password?{' '}
        <Link to="/login" className="font-semibold text-[#E23722] hover:underline">
          Return to Sign In
        </Link>
      </div>
    </div>
  );
};

// 5. Reset Password Page
export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tokenParam = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || '';

  const [token, setToken] = useState(tokenParam);
  const [email, setEmail] = useState(emailParam);
  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newPassword) return;

    setStatus('loading');
    try {
      const res = await authApi.resetPassword({ token, email, newPassword });
      if (res.success) {
        setStatus('success');
        setMessage(res.message);
      } else {
        setStatus('error');
        setMessage(res.message);
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Password reset failed.');
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-16 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-display font-bold text-[#242424]">Choose New Password</h1>
        <p className="text-xs text-stone-500">Enter your reset code and set your new account password</p>
      </div>

      {status === 'success' ? (
        <div className="bg-white p-6 rounded-xl border border-[#EFEAE4] text-center space-y-4">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
          <h3 className="font-display font-bold text-lg text-emerald-800">Password Reset Complete!</h3>
          <p className="text-xs text-stone-600">{message}</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-2.5 bg-[#E23722] hover:bg-[#C02613] text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Sign In with New Password
          </button>
        </div>
      ) : (
        <form onSubmit={handleReset} className="bg-white p-6 rounded-xl border border-[#EFEAE4] shadow-xs space-y-4">
          {status === 'error' && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Reset Token</label>
            <input
              type="text"
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste reset token here..."
              className="w-full px-3 py-2 bg-white border border-[#EFEAE4] rounded-lg text-xs font-mono-data text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#E23722]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">New Password (min 6 chars)</label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-white border border-[#EFEAE4] rounded-lg text-xs text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#E23722]"
            />
          </div>

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full py-2.5 bg-[#E23722] hover:bg-[#C02613] disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-colors"
          >
            {status === 'loading' ? 'Updating Password...' : 'Save New Password'}
          </button>
        </form>
      )}
    </div>
  );
};
