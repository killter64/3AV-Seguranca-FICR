'use client';

import React, { useRef, useCallback, useState, useEffect } from 'react';
import {
  BehaviorTracker,
  generateMockCaptchaToken,
  verifyCaptcha,
} from '@/services/captcha.service';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CaptchaCheckboxProps {
  onVerify: (token: string, verified: boolean) => void;
  className?: string;
}

/**
 * Componente CAPTCHA
 * 
 * Simula Google reCAPTCHA v3 com:
 * 1. Checkbox "Não sou um robô"
 * 2. Análise comportamental (movimento mouse, digitação, etc)
 * 3. Score de confiança (0-1)
 * 
 * Quando usuário clica:
 * - Inicia rastreamento de comportamento
 * - Coleta métricas (mouse, teclado, foco)
 * - Calcula score
 * - Se score >= 0.5, marca como verificado
 * - Se score < 0.5, mostra alerta (pode tentar novamente)
 */
export function CaptchaCheckbox({
  onVerify,
  className,
}: CaptchaCheckboxProps) {
  const [isChecked, setIsChecked] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [suspiciousActivity, setSuspiciousActivity] = useState(false);
  const trackerRef = useRef<BehaviorTracker | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Iniciar rastreamento ao marcar checkbox
  const handleCheckChange = useCallback(async () => {
    if (!isChecked) {
      // Iniciando rastreamento
      trackerRef.current = new BehaviorTracker();
      setIsChecked(true);
      setVerified(false);
      setScore(null);
      setSuspiciousActivity(false);

      // Simular delay visual (como se estivesse analisando)
      setIsVerifying(true);
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Calcular score comportamental
      if (trackerRef.current) {
        const report = trackerRef.current.getReport();
        let finalScore = report.score;
        
        // MODO DEV: Aceitar automaticamente em ambiente de desenvolvimento
        // Se score é baixo (< 0.4), boost para 0.75 para permitir teste
        if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development' && finalScore < 0.4) {
          console.log('[CAPTCHA-DEV] Score baixo detectado, aplicando boost para teste');
          finalScore = 0.75; // Passará facilmente
        }
        
        setScore(finalScore);

        // Verificar com API (simulada)
        const token = generateMockCaptchaToken();
        const result = await verifyCaptcha(token, finalScore);

        if (result.success) {
          setVerified(true);
          onVerify(token, true);
        } else {
          // Atividade suspeita
          setSuspiciousActivity(true);
          setIsChecked(false);
          onVerify('', false);
        }
      }

      setIsVerifying(false);
    } else {
      // Desmarcando
      setIsChecked(false);
      setVerified(false);
      setScore(null);
      setSuspiciousActivity(false);
      trackerRef.current = null;
      onVerify('', false);
    }
  }, [isChecked, onVerify]);

  // Rastrear movimento do mouse
  useEffect(() => {
    if (!trackerRef.current || !isChecked) return;

    const handleMouseMove = (e: MouseEvent) => {
      trackerRef.current?.recordMouseMovement(e.clientX, e.clientY);
    };

    const handleKeyPress = () => {
      trackerRef.current?.recordKeyPress();
    };

    const handleFocus = () => {
      trackerRef.current?.recordFocusChange();
    };

    // Adicionar listeners ao container e seus filhos
    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('keypress', handleKeyPress);
      container.addEventListener('focus', handleFocus, true);
      container.addEventListener('blur', handleFocus, true);
    }

    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('keypress', handleKeyPress);
        container.removeEventListener('focus', handleFocus, true);
        container.removeEventListener('blur', handleFocus, true);
      }
    };
  }, [isChecked]);

  return (
    <div ref={containerRef} className={cn('space-y-3', className)}>
      {/* Checkbox */}
      <Card className="border-slate-700 bg-slate-800 p-4">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={isChecked || verified}
            onChange={handleCheckChange}
            disabled={isVerifying}
            className={cn(
              'mt-1 h-5 w-5 rounded cursor-pointer accent-green-500',
              'border-slate-600 bg-slate-700',
              isVerifying && 'opacity-50 cursor-not-allowed'
            )}
            aria-label="Verificação reCAPTCHA"
          />

          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-200 cursor-pointer">
                Não sou um robô
              </label>

              {isVerifying && (
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              )}

              {verified && (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              )}

              {suspiciousActivity && (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
            </div>

            {isVerifying && (
              <p className="text-xs text-slate-400">
                Analisando padrões de comportamento...
              </p>
            )}

            {verified && (
              <p className="text-xs text-emerald-400">
                ✓ Verificação concluída
              </p>
            )}

            {suspiciousActivity && (
              <p className="text-xs text-red-400">
                ⚠ Atividade suspeita detectada. Tente novamente.
              </p>
            )}
          </div>

          <div className="text-right">
            <p className="text-xs text-slate-400 whitespace-nowrap">
              reCAPTCHA
            </p>
            <p className="text-xs text-slate-500">Privado</p>
          </div>
        </div>
      </Card>

      {/* Score de Confiança */}
      {score !== null && (
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Confiança:</span>
            <span className="font-mono font-semibold text-slate-200">
              {(score * 100).toFixed(0)}%
            </span>
          </div>

          {/* Barra de Score */}
          <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-300',
                score >= 0.7
                  ? 'bg-emerald-500'
                  : score >= 0.5
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
              )}
              style={{ width: `${score * 100}%` }}
            />
          </div>

          {/* Interpretação */}
          <p className="text-xs text-slate-400">
            {score >= 0.7 && '✓ Confiável'}
            {score >= 0.5 && score < 0.7 && '~ Moderado'}
            {score < 0.5 && '✗ Suspeito'}
          </p>
        </div>
      )}

      {/* Explicação educacional */}
      <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
        <p className="text-xs text-blue-300 leading-relaxed">
          <span className="font-semibold">Sobre reCAPTCHA:</span> Esta
          verificação analisa seu comportamento (movimento do mouse,
          digitação, padrão de cliques) para detectar automações. Nenhum
          puzzle visual é necessário. Em produção, usa Google reCAPTCHA v3.
        </p>
      </div>
    </div>
  );
}

export default CaptchaCheckbox;
