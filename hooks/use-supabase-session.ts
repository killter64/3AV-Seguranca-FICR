'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { createClient } from '@/utils/supabase/client';

/**
 * Hook para sincronizar sessão do Supabase com o Zustand store
 *
 * - Verifica a sessão do Supabase no carregamento inicial
 * - Atualiza o Zustand store com os dados do usuário
 * - Escuta mudanças na autenticação (login/logout)
 */
export function useSupabaseSession() {
  const [isLoading, setIsLoading] = useState(true);
  const setUser = useAuthStore((state) => state.setUser);
  const setToken = useAuthStore((state) => state.setToken);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const user = useAuthStore((state) => state.user); // Adicionamos isso para log
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    // Função para verificar a sessão atual
    const checkSession = async () => {
      console.log('[useSupabaseSession] checkSession()');
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('[useSupabaseSession] Sessão do Supabase:', session);

        if (mounted) {
          if (session) {
            // Sessão existe, atualizar o store
            const userData = {
              id: session.user.id,
              email: session.user.email || '',
              mfaEnabled: (session.user.factors?.length ?? 0) > 0,
              preferredMfa: session.user.user_metadata?.preferred_mfa as any,
            };
            console.log('[useSupabaseSession] Setando usuário no store:', userData);
            setUser(userData);
            setToken(
              session.access_token,
              session.user,
              new Date(session.expires_at! * 1000).getTime()
            );
          } else {
            console.log('[useSupabaseSession] Sem sessão, limpando store');
            clearAuth();
          }
        }
      } catch (error) {
        console.error('[useSupabaseSession] Erro ao verificar sessão:', error);
        if (mounted) {
          clearAuth();
        }
      } finally {
        if (mounted) {
          console.log('[useSupabaseSession] setIsLoading(false)');
          setIsLoading(false);
        }
      }
    };

    // Verificar sessão inicial
    checkSession();

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[useSupabaseSession] onAuthStateChange:', event, session);
        if (!mounted) return;

        if (session) {
          const userData = {
            id: session.user.id,
            email: session.user.email || '',
            mfaEnabled: (session.user.factors?.length ?? 0) > 0,
            preferredMfa: session.user.user_metadata?.preferred_mfa as any,
          };
          console.log('[useSupabaseSession] onAuthStateChange: setUser', userData);
          setUser(userData);
          setToken(
            session.access_token,
            session.user,
            new Date(session.expires_at! * 1000).getTime()
          );
        } else {
          console.log('[useSupabaseSession] onAuthStateChange: clearAuth');
          clearAuth();
        }
        setIsLoading(false);
      }
    );

    // Limpar ao desmontar
    return () => {
      console.log('[useSupabaseSession] Desmontando hook');
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [supabase, setUser, setToken, clearAuth]);

  console.log('[useSupabaseSession] Estado atual:', { isLoading, user });

  return { isLoading };
}
