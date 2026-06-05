import React from 'react';
import { analyzePasswordStrength } from '@/lib/validators';
import { Progress } from '@/components/ui/progress';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordStrengthMeterProps {
  password: string;
  showCriteria?: boolean;
  className?: string;
}

export function PasswordStrengthMeter({ password, showCriteria = true, className }: PasswordStrengthMeterProps) {
  const analysis = analyzePasswordStrength(password);
  const { score, level, criteria } = analysis;
  const percentage = (score / 5) * 100;

  const levelColors = { weak: 'text-red-500', medium: 'text-yellow-500', strong: 'text-emerald-500' };
  const levelLabels = { weak: 'Fraca', medium: 'Média', strong: 'Forte' };

  const criteriaList = [
    { label: 'Mínimo 12 caracteres', met: criteria.minLength },
    { label: 'Letra MAIÚSCULA', met: criteria.uppercase },
    { label: 'Letra minúscula', met: criteria.lowercase },
    { label: 'Número (0-9)', met: criteria.numbers },
    { label: 'Símbolo especial (!@#$...)', met: criteria.symbols },
  ];

  return (
    <div className={cn('space-y-3', className)}>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">Força da Senha</label>
          <span className={cn('text-sm font-semibold', levelColors[level])}>{levelLabels[level]}</span>
        </div>
        <Progress value={percentage} className="h-2 bg-slate-700" aria-label={`Força da senha: ${levelLabels[level]}`} />
      </div>

      {showCriteria && password.length > 0 && (
        <div className="space-y-2 rounded-lg border border-slate-700 bg-slate-800/50 p-3">
          <p className="text-xs font-medium text-slate-300">Requisitos:</p>
          <ul className="space-y-1.5">
            {criteriaList.map((criterion) => (
              <li key={criterion.label} className="flex items-center gap-2 text-xs text-slate-300">
                {criterion.met ? (
                  <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                ) : (
                  <X className="h-4 w-4 text-slate-500 flex-shrink-0" />
                )}
                <span className={criterion.met ? 'text-slate-300' : 'text-slate-500'}>{criterion.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {password.length > 0 && level !== 'strong' && (
        <p className="text-xs text-yellow-600 bg-yellow-500/10 rounded p-2 border border-yellow-500/20">
          💡 Dica: Use letras maiúsculas, números e símbolos para uma senha mais segura.
        </p>
      )}

      {level === 'strong' && password.length > 0 && (
        <p className="text-xs text-emerald-600 bg-emerald-500/10 rounded p-2 border border-emerald-500/20">
          ✓ Excelente! Sua senha está muito segura.
        </p>
      )}
    </div>
  );
}

export default PasswordStrengthMeter;
