import React from 'react';
import { Card } from '@/components/ui/card';

export function SecurityHeadersNote() {
  return (
    <Card className="border-slate-700 bg-slate-800/30 p-3">
      <p className="text-xs text-slate-400 leading-relaxed">
        <span className="font-semibold text-slate-300">🔒 Headers de Segurança:</span>{' '}
        Este sistema implementa Content Security Policy (CSP), X-Frame-Options, X-Content-Type-Options,
        Strict-Transport-Security (HSTS) e Referrer-Policy para mitigar vetores de ataque comuns (XSS, Clickjacking).
      </p>
    </Card>
  );
}

export default SecurityHeadersNote;
