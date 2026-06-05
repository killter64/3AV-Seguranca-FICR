import React from 'react';
import { Card } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  className?: string;
}

export function AuthLayout({ children, title, subtitle, className }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-950 via-blue-950/20 to-slate-950 flex items-center justify-center p-4">
      <div className="fixed inset-0 -z-10 overflow-hidden opacity-5">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,#10b981_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="w-full max-w-md space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="space-y-3 text-center">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 blur-xl rounded-full" />
              <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 p-3 rounded-lg border border-emerald-500/30">
                <Shield className="h-8 w-8 text-emerald-400" />
              </div>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-slate-100">{title}</h1>

          {subtitle && (
            <p className="text-sm text-slate-400">{subtitle}</p>
          )}

          <p className="text-xs text-slate-500">
            Sistema de Login Seguro - Autenticação Multifator (MFA)
          </p>
        </div>

        <Card className={cn(
          'border-emerald-500/20 bg-slate-900/50 backdrop-blur-sm shadow-2xl shadow-emerald-500/10',
          'p-6 space-y-6',
          className
        )}>
          {children}
        </Card>

        <div className="text-center space-y-2 text-xs text-slate-500">
          <div className="flex items-center justify-center gap-1">
            <span>🔒</span>
            <span>Conexão segura</span>
            <span>|</span>
            <span>Dados criptografados</span>
          </div>
          <p>© 2024 Sistema ADS - Educacional apenas</p>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
