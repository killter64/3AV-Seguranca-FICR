import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { createClient } from '@/utils/supabase/client';

export function useSupabaseSession() {
  const [isLoading, setIsLoading] = useState(true);
  const setUser = useAuthStore((state) => state.setUser);
  const setToken = useAuthStore((state) => state.setToken);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          if (session) {
            const userData = {
              id: session.user.id,
              email: session.user.email || '',
              mfaEnabled: (session.user.factors?.length ?? 0) > 0,
              preferredMfa: session.user.user_metadata?.preferred_mfa as any,
            };
            setUser(userData);
            setToken(
              session.access_token,
              session.user,
              new Date(session.expires_at! * 1000).getTime()
            );
          } else {
            clearAuth();
          }
        }
      } catch (error) {
        if (mounted) clearAuth();
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (session) {
        const userData = {
          id: session.user.id,
          email: session.user.email || '',
          mfaEnabled: (session.user.factors?.length ?? 0) > 0,
          preferredMfa: session.user.user_metadata?.preferred_mfa as any,
        };
        setUser(userData);
        setToken(
          session.access_token,
          session.user,
          new Date(session.expires_at! * 1000).getTime()
        );
      } else {
        clearAuth();
      }
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  return { isLoading };
}
