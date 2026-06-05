'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogContent, AlertDialogDescription } from '@/components/ui/alert-dialog';
import {
  isWebAuthnSupported,
  authenticateWithBiometrics,
} from '@/services/webauthn.service';
import { Fingerprint, Loader2, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BiometricButtonProps {
  onSuccess: (credentialId: string) => void;
  onError?: (error: string) => void;
  userId: string;
  disabled?: boolean;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
}

/**
 * Componente BiometricButton
 * 
 * Permite autenticação via:
 * - TouchID (Mac)
 * - Windows Hello (Windows)
 * - Biometria Android
 * - Chaves de segurança USB (YubiKey)
 * 
 * Usa Web Authentication API (WebAuthn/FIDO2)
 * 
 * CHAMA API REAL DO NAVEGADOR - não é simulado!
 * Mostrará prompt nativo do sistema para biometria.
 */
export function BiometricButton({
  onSuccess,
  onError,
  userId,
  disabled = false,
  className,
  variant = 'outline',
}: BiometricButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(isWebAuthnSupported());
  const [showModal, setShowModal] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(
    'idle'
  );
  const [message, setMessage] = useState('');
  const [errorDetails, setErrorDetails] = useState('');

  const handleBiometricAuth = async () => {
    if (!isSupported) {
      setStatus('error');
      setMessage('WebAuthn não suportado');
      setErrorDetails(
        'Seu navegador ou dispositivo não suporta biometria. Tente com Chrome, Edge ou Firefox recente.'
      );
      setShowModal(true);
      onError?.(
        'WebAuthn não suportado neste navegador'
      );
      return;
    }

    setIsLoading(true);
    setShowModal(true);
    setStatus('loading');
    setMessage('Iniciando autenticação biométrica...');
    setErrorDetails('');

    try {
      const result = await authenticateWithBiometrics(userId);

      if (result.success && result.credentialId) {
        setStatus('success');
        setMessage('✓ Autenticação bem-sucedida!');
        setErrorDetails('');
        onSuccess(result.credentialId);

        // Fechar modal após sucesso
        setTimeout(() => setShowModal(false), 1500);
      } else {
        setStatus('error');
        setMessage('Falha na autenticação biométrica');
        setErrorDetails(result.message);
        onError?.(result.message);
      }
    } catch (error) {
      setStatus('error');
      setMessage('Erro na autenticação');
      setErrorDetails(
        error instanceof Error ? error.message : 'Erro desconhecido'
      );
      onError?.(
        error instanceof Error ? error.message : 'Erro desconhecido'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Botão Principal */}
      <Button
        onClick={handleBiometricAuth}
        disabled={disabled || isLoading || !isSupported}
        variant={variant}
        size="sm"
        className={cn(
          'gap-2',
          !isSupported && 'opacity-50 cursor-not-allowed',
          className
        )}
        title={
          !isSupported
            ? 'WebAuthn não suportado neste navegador'
            : 'Autenticar com biometria'
        }
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Fingerprint className="h-4 w-4" />
        )}
        {isLoading ? 'Autenticando...' : 'Biometria'}
      </Button>

      {/* Modal de Status */}
      <AlertDialog open={showModal} onOpenChange={setShowModal}>
        <AlertDialogContent className="border-slate-700 bg-slate-900 max-w-md">
          <div className="space-y-4">
            {/* Status Icon */}
            <div className="flex justify-center">
              {status === 'loading' && (
                <div className="flex flex-col items-center gap-2">
                  <div className="relative h-12 w-12">
                    {/* Scanner animado */}
                    <div className="absolute inset-0 border-2 border-blue-500 rounded-lg animate-pulse" />
                    <Fingerprint className="absolute inset-0 m-auto h-6 w-6 text-blue-500 animate-pulse" />
                  </div>
                </div>
              )}
              {status === 'success' && (
                <CheckCircle2 className="h-12 w-12 text-emerald-500" />
              )}
              {status === 'error' && (
                <AlertCircle className="h-12 w-12 text-red-500" />
              )}
            </div>

            {/* Mensagem */}
            <div className="space-y-2 text-center">
              <h3 className="font-semibold text-slate-200">{message}</h3>
              {errorDetails && (
                <p className="text-sm text-slate-400">{errorDetails}</p>
              )}
            </div>

            {/* Instruções por Status */}
            {status === 'loading' && (
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 space-y-2">
                <p className="text-xs font-semibold text-blue-300">
                  Instruções:
                </p>
                <ul className="text-xs text-blue-300 space-y-1">
                  <li>• Toque o seu sensor biométrico</li>
                  <li>• Ou insira seu PIN da chave de segurança</li>
                  <li>• A janela pode levar até 60 segundos</li>
                </ul>
              </div>
            )}

            {status === 'error' && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                <p className="text-xs text-red-300 leading-relaxed">
                  <span className="font-semibold">O que fazer:</span> Se você
                  não tem biometria configurada, tente com senha TOTP. Se o
                  erro persistir, seu navegador pode não suportar WebAuthn.
                </p>
              </div>
            )}

            {/* Info */}
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
              <p className="text-xs text-slate-400 leading-relaxed">
                <span className="font-semibold text-slate-300">WebAuthn:</span>{' '}
                Padrão FIDO2 que usa criptografia assimétrica. A chave privada
                nunca sai do seu dispositivo. Mais seguro que senhas.
              </p>
            </div>

            {/* Botão Fechar/Tentar Novamente */}
            <div className="flex gap-2 justify-center">
              {status === 'error' && (
                <Button
                  onClick={() => {
                    setStatus('idle');
                    setMessage('');
                    setErrorDetails('');
                  }}
                  variant="outline"
                  size="sm"
                  className="border-slate-700"
                >
                  Tentar Novamente
                </Button>
              )}
              <Button
                onClick={() => setShowModal(false)}
                variant={status === 'success' ? 'default' : 'outline'}
                size="sm"
                className={
                  status === 'success'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'border-slate-700'
                }
              >
                {status === 'success' ? 'Continuar' : 'Fechar'}
              </Button>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default BiometricButton;
