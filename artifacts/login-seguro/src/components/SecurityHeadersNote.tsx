import React from 'react';
import { Card } from '@/components/ui/card';

export function SecurityHeadersNote() {
  return (
    <Card className="border-slate-700 bg-slate-800/30 p-3">
      <p className="text-xs text-slate-400 leading-relaxed">
        <span className="font-semibold text-slate-300">🔒 Segurança dos Dados:</span>{' '}
        Seus dados financeiros e contábeis são protegidos com criptografia, políticas de segurança e controles de acesso rigorosos para garantir a integridade e confidencialidade das informações.
      </p>
    </Card>
  );
}

export default SecurityHeadersNote;
