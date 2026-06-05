'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, Lock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

/**
 * BruteForceLock Component
 *
 * Componente que mostra o estado de proteção contra força bruta.
 * Exibe cooldown regressivo quando o usuário atinge o limite de tentativas.
 *
 * Props:
 * - isLocked: se está travado
 * - remainingSeconds: segundos até destravar
 * - attempts: tentativas falhadas até agora
 * - maxAttempts: máximo de tentativas permitidas
 */

interface BruteForceLockProps {
  isLocked: boolean;
  remainingSeconds: number;
  attempts: number;
  maxAttempts: number;
}

export function BruteForceLock({
  isLocked,
  remainingSeconds,
  attempts,
  maxAttempts,
}: BruteForceLockProps) {
  const [displaySeconds, setDisplaySeconds] = useState(remainingSeconds);

  useEffect(() => {
    setDisplaySeconds(remainingSeconds);
  }, [remainingSeconds]);

  useEffect(() => {
    if (!isLocked || displaySeconds <= 0) return;

    const timer = setInterval(() => {
      setDisplaySeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isLocked, displaySeconds]);

  if (!isLocked) {
    return null;
  }

  const progressPercent = ((maxAttempts - attempts) / maxAttempts) * 100;

  return (
    <div className="space-y-3">
      <Alert className="border-red-500/50 bg-red-950/20 text-red-100">
        <Lock className="h-4 w-4 text-red-500" />
        <AlertTitle className="text-red-400">
          Proteção contra Força Bruta Ativada
        </AlertTitle>
        <AlertDescription className="text-red-300/80">
          Você atingiu o limite de {maxAttempts} tentativas. Aguarde{' '}
          <span className="font-mono font-bold text-red-400">
            {displaySeconds}s
          </span>{' '}
          para tentar novamente.
        </AlertDescription>
      </Alert>

      {/* Barra de progresso visual */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-slate-400">
          <span>Desbloqueio em:</span>
          <span className="font-mono">
            {String(displaySeconds).padStart(2, '0')}s
          </span>
        </div>
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-1000 rounded-full"
            style={{ width: `${(displaySeconds / remainingSeconds) * 100}%` }}
          />
        </div>
      </div>

      {/* Tentativas restantes */}
      <div className="text-xs text-slate-400 bg-slate-900/50 rounded p-2">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-3 w-3 text-amber-500" />
          Tentativas: {attempts}/{maxAttempts}
        </div>
      </div>
    </div>
  );
}

export default BruteForceLock;
