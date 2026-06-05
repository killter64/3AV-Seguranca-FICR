import { useState, useEffect } from 'react';
import { create } from 'zustand';

export type MfaMethod = 'totp' | 'email' | 'passkey';

export interface AuthUser {
  id: string;
  email: string;
  mfaEnabled: boolean;
  preferredMfa?: MfaMethod;
  lastLogin?: string;
  ipAddress?: string;
}

export interface AuthStore {
  user: AuthUser | null;
  token: string | null;
  expiresAt: number | null;
  mfaPending: boolean;
  isLoading: boolean;
  error: string | null;
  aalLevel?: string;

  setUser: (user: AuthUser | null) => void;
  setToken: (token: string, payload?: any, expiresAt?: number) => void;
  clearAuth: () => void;
  setMfaPending: (pending: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setAALLevel: (level: string) => void;
  isAuthenticated: () => boolean;
  isTokenExpired: () => boolean;
  getAuthHeader: () => Record<string, string>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  expiresAt: null,
  mfaPending: false,
  isLoading: false,
  error: null,
  aalLevel: undefined,

  setUser: (user) => set({ user }),
  setToken: (token, _payload, expiresAt) => set({ token, expiresAt }),
  clearAuth: () => set({ user: null, token: null, expiresAt: null, mfaPending: false, error: null, aalLevel: undefined }),
  setMfaPending: (pending) => set({ mfaPending: pending }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setAALLevel: (level) => set({ aalLevel: level }),

  isAuthenticated: () => {
    const { user } = get();
    return !!user;
  },

  isTokenExpired: () => {
    const { expiresAt } = get();
    return expiresAt ? Date.now() >= expiresAt : true;
  },

  getAuthHeader: () => {
    const { token } = get();
    return (token ? { Authorization: `Bearer ${token}` } : {}) as Record<string, string>;
  },
}));

export function useIsAuthenticated(): boolean {
  return useAuthStore((state) => state.isAuthenticated());
}

export function useAuthUser(): AuthUser | null {
  return useAuthStore((state) => state.user);
}

export function useTokenExpiration(): {
  isExpired: boolean;
  expiresAt: number | null;
  remainingSeconds: number;
} {
  const expiresAt = useAuthStore((state) => state.expiresAt);
  const isExpired = useAuthStore((state) => state.isTokenExpired());
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    if (!expiresAt) {
      setRemainingSeconds(0);
      return;
    }

    const updateTimer = () => {
      const secs = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setRemainingSeconds(secs);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return { isExpired, expiresAt, remainingSeconds };
}

export function useLogout() {
  return () => {
    const { clearAuth } = useAuthStore.getState();
    clearAuth();
  };
}

export default useAuthStore;
