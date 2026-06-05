'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { AlertCircle, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Componente de Informações sobre Headers de Segurança
 * 
 * Exibe uma lista dos headers HTTP recomendados para segurança.
 * Educacional - mostra como configurar em produção.
 */
export function SecurityHeadersNote() {
  const [isExpanded, setIsExpanded] = useState(false);

  const headers = [
    {
      name: 'Strict-Transport-Security',
      value: 'max-age=31536000; includeSubDomains',
      description: 'Força HTTPS em todas as conexões futuras',
    },
    {
      name: 'Content-Security-Policy',
      value: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'",
      description: 'Previne XSS limitando origens de scripts',
    },
    {
      name: 'X-Content-Type-Options',
      value: 'nosniff',
      description: 'Previne MIME sniffing de tipos de arquivo',
    },
    {
      name: 'X-Frame-Options',
      value: 'DENY',
      description: 'Previne clickjacking (framing em outro site)',
    },
    {
      name: 'X-XSS-Protection',
      value: '1; mode=block',
      description: 'Proteção XSS (browsers antigos)',
    },
    {
      name: 'Referrer-Policy',
      value: 'strict-origin-when-cross-origin',
      description: 'Controla informações de referrer',
    },
    {
      name: 'Permissions-Policy',
      value: "geolocation=(), microphone=(), camera=()",
      description: 'Desabilita features perigosas',
    },
  ];

  return (
    <Card className="border-blue-500/20 bg-blue-500/5 p-4 space-y-3">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 text-sm font-semibold text-blue-300 hover:text-blue-200 transition-colors"
      >
        <AlertCircle className="h-4 w-4" />
        <span>Headers de Segurança HTTP (Produção)</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 ml-auto transition-transform',
            isExpanded && 'rotate-180'
          )}
        />
      </button>

      {/* Detalhes */}
      {isExpanded && (
        <div className="space-y-3 border-t border-blue-500/20 pt-3">
          <p className="text-xs text-blue-300 leading-relaxed">
            Estes headers devem ser configurados no servidor (NextJS, Express, etc).
            Eles ajudam a proteger contra vários tipos de ataque.
          </p>

          {/* Lista de Headers */}
          <div className="space-y-2">
            {headers.map((header, idx) => (
              <div
                key={idx}
                className="rounded bg-slate-800/50 border border-slate-700 p-2.5 space-y-1"
              >
                <div className="flex items-start gap-2">
                  <span className="text-xs font-mono font-semibold text-emerald-400 flex-shrink-0 mt-0.5">
                    {idx + 1}.
                  </span>
                  <div className="flex-1 space-y-1">
                    <p className="text-xs font-semibold text-slate-200">
                      {header.name}
                    </p>
                    <code className="block text-xs text-slate-400 bg-slate-900/50 rounded p-1.5 overflow-x-auto border border-slate-700 font-mono">
                      {header.value}
                    </code>
                    <p className="text-xs text-slate-400">
                      💡 {header.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Configuração NextJS */}
          <div className="rounded bg-slate-800/50 border border-emerald-500/20 p-3 space-y-2">
            <p className="text-xs font-semibold text-emerald-300">
              ✓ Configurar no Next.js:
            </p>
            <code className="block text-xs text-slate-300 bg-slate-900/70 rounded p-2 overflow-x-auto font-mono border border-slate-700">
              {`// next.config.mjs
const nextConfig = {
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000'
        },
        // ...
      ]
    }
  ]
};`}
            </code>
          </div>

          {/* Ou com middleware */}
          <div className="rounded bg-slate-800/50 border border-emerald-500/20 p-3 space-y-2">
            <p className="text-xs font-semibold text-emerald-300">
              ✓ Ou via Middleware:
            </p>
            <code className="block text-xs text-slate-300 bg-slate-900/70 rounded p-2 overflow-x-auto font-mono border border-slate-700">
              {`// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000'
  );
  
  return response;
}`}
            </code>
          </div>

          {/* Verificação */}
          <p className="text-xs text-slate-400">
            Verificar headers: use
            <code className="text-emerald-400 font-mono"> curl -i https://seu-site.com</code>
          </p>
        </div>
      )}
    </Card>
  );
}

export default SecurityHeadersNote;
