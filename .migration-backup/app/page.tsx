'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useIsAuthenticated } from '@/store/auth.store';
import { useSupabaseSession } from '@/hooks/use-supabase-session';

/**
 * Página Inicial
 * 
 * Lógica:
 * - Espera o Supabase session hook carregar
 * - Se autenticado → redirecionar para /dashboard
 * - Se não autenticado → redirecionar para /login
 */
export default function HomePage() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const { isLoading } = useSupabaseSession();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [isAuthenticated, router, isLoading]);

  // Mostrar loading enquanto carrega a sessão
  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-slate-400 text-sm">Verificando sessão...</p>
      </div>
    </div>
  );
}
