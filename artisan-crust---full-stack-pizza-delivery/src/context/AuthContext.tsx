import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string; needsVerification?: boolean; verificationToken?: string; email?: string }>;
  loginWithGoogle: (data: { credential?: string; email?: string; name?: string; picture?: string }) => Promise<{ success: boolean; message?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; message: string; verificationToken?: string }>;
  logout: () => void;
  verifyEmail: (token: string, email?: string) => Promise<{ success: boolean; message: string }>;
  quickLoginAs: (role: Role) => Promise<void>;
  unlockAdminWithPasscode: (passcode: string, email?: string) => Promise<{ success: boolean; message?: string }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('artisan_token'));
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = async () => {
    try {
      const data = await authApi.getProfile();
      if (data.success && data.user) {
        setUser(data.user);
      } else {
        logout();
      }
    } catch (err) {
      console.warn('Failed to fetch user profile, clearing session:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      const res = await authApi.login({ email, password });
      if (res.success && res.token) {
        localStorage.setItem('artisan_token', res.token);
        setToken(res.token);
        setUser(res.user);
        return { success: true };
      }
      return { success: false, message: res.message || 'Login failed.' };
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed.';
      const needsVerification = err.response?.data?.needsVerification;
      const verificationToken = err.response?.data?.verificationToken;
      return { success: false, message: msg, needsVerification, verificationToken };
    }
  };

  const loginWithGoogle = async (data: { credential?: string; email?: string; name?: string; picture?: string }) => {
    try {
      const res = await authApi.googleLogin(data);
      if (res.success && res.token) {
        localStorage.setItem('artisan_token', res.token);
        setToken(res.token);
        setUser(res.user);
        return { success: true };
      }
      return { success: false, message: res.message || 'Google sign-in failed.' };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || 'Google sign-in failed.' };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const res = await authApi.register({ name, email, password });
      return {
        success: res.success,
        message: res.message,
        verificationToken: res.verificationToken
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || 'Registration failed.'
      };
    }
  };

  const verifyEmail = async (verificationToken: string, email?: string) => {
    try {
      const res = await authApi.verifyEmail({ token: verificationToken, email });
      return { success: res.success, message: res.message };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || 'Verification failed.'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('artisan_token');
    setToken(null);
    setUser(null);
  };

  // Quick switcher for demo and evaluation convenience
  const quickLoginAs = async (role: Role) => {
    setLoading(true);
    if (role === 'admin') {
      await login('admin@artisancrust.com', 'Admin@12345');
    } else {
      await login('customer@example.com', 'Customer@12345');
    }
    setLoading(false);
  };

  const unlockAdminWithPasscode = async (passcode: string, email?: string) => {
    try {
      const res = await authApi.verifyAdminPasscode({ passcode, email });
      if (res.success && res.token) {
        localStorage.setItem('artisan_token', res.token);
        setToken(res.token);
        setUser(res.user);
        return { success: true, message: res.message };
      }
      return { success: false, message: res.message || 'Invalid passcode.' };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || 'Access Denied: Invalid Security PIN.' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        loginWithGoogle,
        register,
        logout,
        verifyEmail,
        quickLoginAs,
        unlockAdminWithPasscode,
        refreshProfile: fetchProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
