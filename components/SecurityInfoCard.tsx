'use client';

import React from 'react';
import { Shield, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * SecurityInfoCard Component
 *
 * Componente que exibe informações de segurança da conta no dashboard.
 * Mostra último login, IP, status MFA e expiração de token.
 *
 * Props:
 * - lastLogin: ISO timestamp do último login
 * - ipAddress: endereço IP simulado
 * - mfaEnabled: se MFA está ativo
 * - tokenExpiresIn: segundos até expiração do token
 */

interface SecurityInfoCardProps {
  lastLogin?: string;
  ipAddress?: string;
  mfaEnabled: boolean;
  tokenExpiresIn?: number;
}

export function SecurityInfoCard({
  lastLogin = new Date().toISOString(),
  ipAddress = '192.168.1.42',
  mfaEnabled = true,
  tokenExpiresIn = 900,
}: SecurityInfoCardProps) {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatLastLogin = (iso: string) => {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}min atrás`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <Card className="border-emerald-500/30 bg-slate-900/50 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-slate-900 to-slate-800 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-400" />
            <CardTitle className="text-emerald-400">
              Informações de Segurança
            </CardTitle>
          </div>
          <Badge
            variant="default"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Seguro
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Último Login */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-700/50">
          <div>
            <p className="text-sm text-slate-400 mb-1">Último Login</p>
            <p className="font-mono text-sm text-emerald-300">
              {formatLastLogin(lastLogin)}
            </p>
          </div>
          <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-1 flex-shrink-0" />
        </div>

        {/* Endereço IP */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-700/50">
          <div>
            <p className="text-sm text-slate-400 mb-1">Endereço IP (Simulado)</p>
            <p className="font-mono text-sm text-blue-300">{ipAddress}</p>
          </div>
          <div className="h-5 w-5 rounded-full bg-blue-500/20 border border-blue-500/50 mt-1 flex-shrink-0" />
        </div>

        {/* Status MFA */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-700/50">
          <div>
            <p className="text-sm text-slate-400 mb-1">Autenticação Multifator</p>
            <p className={`text-sm font-semibold ${
              mfaEnabled ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              {mfaEnabled ? '✓ Ativo (TOTP + Biometria)' : 'Desativado'}
            </p>
          </div>
          {mfaEnabled ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-1 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-amber-500 mt-1 flex-shrink-0" />
          )}
        </div>

        {/* Expiração Token */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-400 mb-1">Sessão Expira Em</p>
            <p className="font-mono text-sm text-slate-300">
              {formatTime(tokenExpiresIn || 900)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              (Token JWT em memória - em produção seria HttpOnly Cookie)
            </p>
          </div>
          <Clock className="h-5 w-5 text-slate-400 mt-1 flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}

export default SecurityInfoCard;
