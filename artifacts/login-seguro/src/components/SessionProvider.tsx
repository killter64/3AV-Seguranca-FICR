import React from 'react';
import { useSupabaseSession } from '@/hooks/use-supabase-session';
import { Loader2 } from 'lucide-react';

interface SessionProviderProps {
  children: React.ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const { isLoading } = useSupabaseSession();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 text-emerald-400 mx-auto mb-3" />
          <p className="text-slate-500 text-xs font-mono">Inicializando sessão segura...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default SessionProvider;
