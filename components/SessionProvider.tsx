'use client';

import React from 'react';
import { useSupabaseSession } from '@/hooks/use-supabase-session';

/**
 * Wrapper para garantir que a sessão do Supabase seja sincronizada em toda a app
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  // Isso garante que o hook seja executado em todas as páginas
  useSupabaseSession();
  return <>{children}</>;
}
