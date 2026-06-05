'use client';

import { useState, useEffect } from 'react';
import { create } from 'zustand';

/**
 * Estado Global de Autenticação (Zustand)
 * 
 * Store centralizado para gerenciar:
 * - Usuário autenticado (via Supabase)
 * - Estado de MFA
 * - Tentativas de login
 * - Estados de carregamento e erro
 * 
 * ⚠️  NOTA:
 * Supabase gerencia tokens e cookies automaticamente.
 * Este store é principalmente para estado de UI (loading, errors, MFA).
 * Sessão é recuperada via supabase.auth.getSession() quando necessário.
 */



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
  // Estado
  user: AuthUser | null;
  token: string | null;
  expiresAt: number | null;
  mfaPending: boolean;
  isLoading: boolean;
  error: string | null;
  aalLevel?: string; // 'aal1' ou 'aal2'

  // Ações
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

/**
 * Store Zustand
 * 
 * Alternativa a Context API (mais simples, melhor performance)
 * Subscribers apenas em componentes que usam dados específicos
 */
export const useAuthStore = create<AuthStore>((set, get) => ({
  // Estado inicial
  user: null,
  token: null,
  expiresAt: null,
  mfaPending: false,
  isLoading: false,
  error: null,
  aalLevel: undefined,

  // Setters
  setUser: (user) => set({ user }),

  setToken: (token, payload, expiresAt) => set({ token, expiresAt }),

  clearAuth: () =>
    set({
      user: null,
      token: null,
      expiresAt: null,
      mfaPending: false,
      error: null,
      aalLevel: undefined,
    }),

  setMfaPending: (pending) => set({ mfaPending: pending }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setAALLevel: (level) => set({ aalLevel: level }),

  // Getters/Computados
  isAuthenticated: () => {
    const { user } = get();
    return !!user;
  },

  isTokenExpired: () => {
    const { expiresAt } = get();
    return expiresAt ? Date.now() >= expiresAt : true;
  },

  /**
   * Retorna header Authorization para requisições
   * Uso: fetch('/api/endpoint', { headers: store.getAuthHeader() })
   */
  getAuthHeader: () => {
    const { token } = get();
    return (token ? { Authorization: `Bearer ${token}` } : {}) as Record<string, string>;
  },
}));

/**
 * Hook customizado para verificar autenticação
 * Uso em componentes:
 * 
 * const isAuth = useIsAuthenticated();
 * if (!isAuth) return <Redirect to="/login" />;
 */
export function useIsAuthenticated(): boolean {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  return isAuthenticated;
}

/**
 * Hook customizado para obter dados de usuário
 */
export function useAuthUser(): AuthUser | null {
  return useAuthStore((state) => state.user);
}

/**
 * Hook customizado para tempo restante do token
 */
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

/**
 * Hook para logout
 */
export function useLogout() {
  return () => {
    const { clearAuth } = useAuthStore.getState();
    clearAuth();
    // Frontend redireciona para /login (no componente que chama)
  };
}

/**
 * Exemplo de uso em componente:
 * 
 * function Dashboard() {
 *   const user = useAuthStore((state) => state.user);
 *   const logout = useLogout();
 * 
 *   if (!user) return <Redirect to="/login" />;
 * 
 *   return (
 *     <div>
 *       <h1>Bem-vindo, {user.email}</h1>
 *       <button onClick={logout}>Logout</button>
 *     </div>
 *   );
 * }
 * 
 * // Ou com hook customizado:
 * function ProtectedPage() {
 *   const isAuth = useIsAuthenticated();
 *   if (!isAuth) return <Redirect to="/login" />;
 *   return <Dashboard />;
 * }
 */

export default useAuthStore;
