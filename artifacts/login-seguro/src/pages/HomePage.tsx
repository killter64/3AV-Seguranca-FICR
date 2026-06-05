import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useIsAuthenticated } from '@/store/auth.store';
import { useSupabaseSession } from '@/hooks/use-supabase-session';

export default function HomePage() {
  const [, navigate] = useLocation();
  const isAuthenticated = useIsAuthenticated();
  const { isLoading } = useSupabaseSession();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        navigate('/dashboard');
      } else {
        navigate('/login');
      }
    }
  }, [isAuthenticated, isLoading]);

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-slate-400 text-sm">Verificando sessão...</p>
      </div>
    </div>
  );
}
