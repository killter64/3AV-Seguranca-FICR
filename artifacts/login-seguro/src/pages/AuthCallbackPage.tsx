import React, { useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';
import { createClient } from '@/utils/supabase/client';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const [, navigate] = useLocation();
  const search = useSearch();

  useEffect(() => {
    const params = new URLSearchParams(search);
    const code = params.get('code');
    const next = params.get('next') || '/dashboard';

    if (code) {
      const supabase = createClient();
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (!error) {
          navigate(next);
        } else {
          navigate('/login?error=invalid_verification_code');
        }
      });
    } else {
      navigate('/login?error=invalid_verification_code');
    }
  }, []);

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="animate-spin h-8 w-8 border-emerald-500 mx-auto mb-4 text-emerald-500" />
        <p className="text-slate-400 text-sm">Verificando autenticação...</p>
      </div>
    </div>
  );
}
