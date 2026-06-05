'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useSupabaseSession } from '@/hooks/use-supabase-session';

/**
 * Layout Protegido (Authenticated)
 * 
 * Qualquer rota dentro de (authenticated) verifica:
 * - Se usuário tem sessão válida via Supabase
 * - Se não, redireciona para /login
 * 
 * Rotas protegidas:
 * - /dashboard
 * - /mfa/setup
 */
export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { isLoading } = useSupabaseSession();
  const [hasAttemptedRedirect, setHasAttemptedRedirect] = useState(false);

  useEffect(() => {
    console.log('[AuthenticatedLayout]', { isLoading, user, hasAttemptedRedirect });
    if (!isLoading && !user && !hasAttemptedRedirect) {
      console.log('[AuthenticatedLayout] Redirecionando para /login');
      setHasAttemptedRedirect(true);
      router.push('/login');
    }
  }, [isLoading, user, hasAttemptedRedirect, router]);

  // Enquanto verifica autenticação, mostrar loading
  if (isLoading || hasAttemptedRedirect) {
    return (
      <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-slate-400 text-sm">{isLoading ? 'Verificando autenticação...' : 'Redirecionando...'}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
