'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { otpSchema } from '@/lib/validators';
import {
  enrollMFA,
  createMFAChallenge,
  verifyMFACode,
} from '@/services/totp.service';
import { useAuthStore } from '@/store/auth.store';
import { useSupabaseSession } from '@/hooks/use-supabase-session';
import { QRCodeSVG } from 'qrcode.react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AuthLayout from '@/components/AuthLayout';
import {
  Smartphone,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Copy,
  ArrowLeft,
} from 'lucide-react';

const formSchema = z.object({
  code: otpSchema,
});

type FormValues = z.infer<typeof formSchema>;

type Step = 'totp-scan' | 'totp-verify' | 'complete';

export default function MfaSetupPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const { isLoading: sessionLoading } = useSupabaseSession();

  const [step, setStep] = useState<Step>('totp-scan');
  const [factorId, setFactorId] = useState<string | null>(null);
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [totpUri, setTotpUri] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: '',
    },
  });

  useEffect(() => {
    if (sessionLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    // Iniciar o enroll automático ao carregar
    startMfaEnroll();
  }, [sessionLoading, user, router]);

  const startMfaEnroll = async () => {
    try {
      setIsLoading(true);
      setServerError(null);
      const result = await enrollMFA();
      if (result.success && result.secret && result.uri && result.id) {
        setTotpSecret(result.secret);
        setTotpUri(result.uri);
        setFactorId(result.id);
      } else {
        setServerError(result.message || 'Erro ao gerar QR Code de MFA do Supabase.');
      }
    } catch (err) {
      console.error('[MFA Setup] Erro no setup:', err);
      setServerError('Erro ao iniciar a configuração do MFA.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyTotp = async (data: FormValues) => {
    if (!factorId) {
      setServerError('Fator de autenticação não identificado.');
      return;
    }

    try {
      setIsSubmitting(true);
      setServerError(null);

      // 1. Criar o desafio (challenge) para o fator cadastrado
      const challengeResult = await createMFAChallenge(factorId);
      
      if (!challengeResult.success || !challengeResult.challengeId) {
        setServerError(challengeResult.message || 'Erro ao criar desafio para o código.');
        return;
      }

      // 2. Verificar o código inserido contra o desafio
      const verifyResult = await verifyMFACode(
        data.code,
        challengeResult.challengeId,
        factorId
      );

      if (verifyResult.success) {
        // Atualizar estado global
        if (user) {
          setUser({ ...user, mfaEnabled: true });
        }
        setStep('complete');
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        setServerError(verifyResult.message || 'Código TOTP incorreto.');
      }
    } catch (err) {
      console.error('[MFA Setup] Erro na verificação TOTP:', err);
      setServerError('Erro ao validar o código. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopySecret = async () => {
    if (!totpSecret) return;
    try {
      await navigator.clipboard.writeText(totpSecret);
      alert('Chave copiada para a área de transferência!');
    } catch (err) {
      alert('Não foi possível copiar. Copie manualmente.');
    }
  };

  if (sessionLoading || !user) {
    return (
      <AuthLayout title="Carregando..." subtitle="Aguarde...">
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
        </div>
      </AuthLayout>
    );
  }

  if (step === 'complete') {
    return (
      <AuthLayout title="MFA Configurado!" subtitle="Sua conta está protegida">
        <div className="space-y-6 text-center">
          <div className="flex justify-center">
            <div className="rounded-full bg-emerald-500/20 p-6">
              <CheckCircle2 className="h-12 w-12 text-emerald-400" />
            </div>
          </div>
          <p className="text-slate-300">
            A autenticação de dois fatores (TOTP) foi configurada com sucesso.
            Redirecionando para o Dashboard...
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Configurar Autenticador (MFA)"
      subtitle="Proteja sua conta utilizando 2 fatores"
    >
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button
            onClick={() => router.push('/login')}
            variant="outline"
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para o Login
          </Button>
        </div>

        {serverError && (
          <Alert variant="destructive" className="border-red-500/50 bg-red-500/10">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
          </div>
        ) : (
          <>
            {step === 'totp-scan' && (
              <div className="space-y-6">
                <Card className="border-blue-500/20 bg-blue-500/5 p-4 space-y-3">
                  <p className="text-xs text-blue-300 font-semibold">
                    1. Instale um aplicativo de autenticação (Google Authenticator, Authy ou Microsoft Authenticator) no seu smartphone.
                  </p>
                  <p className="text-xs text-blue-200">
                    2. Abra o aplicativo, adicione uma nova conta e escaneie o código QR abaixo.
                  </p>
                </Card>

                <div className="flex justify-center bg-white rounded-lg p-4 max-w-[240px] mx-auto">
                  {totpUri && (
                    <QRCodeSVG
                      value={totpUri}
                      size={200}
                      level="M"
                      includeMargin={true}
                      fgColor="#000000"
                      bgColor="#ffffff"
                    />
                  )}
                </div>

                <Card className="border-slate-700 bg-slate-800/50 p-4">
                  <p className="text-xs text-slate-400 mb-2">
                    Não consegue escanear? Digite a chave abaixo manualmente no app:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 break-all bg-slate-900 p-2 rounded text-xs text-emerald-400 font-mono">
                      {totpSecret}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCopySecret}
                      className="text-slate-300 hover:bg-slate-800"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>

                <Button
                  onClick={() => setStep('totp-verify')}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  size="lg"
                >
                  Já escaneei: Prosseguir
                </Button>
              </div>
            )}

            {step === 'totp-verify' && (
              <div className="space-y-6">
                <Card className="border-emerald-500/20 bg-emerald-500/5 p-4">
                  <p className="text-xs text-emerald-300">
                    Digite o código temporário de 6 dígitos que está sendo gerado no seu aplicativo autenticador.
                  </p>
                </Card>

                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(handleVerifyTotp)}
                    className="space-y-6"
                  >
                    <FormField
                      control={form.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300 text-center block">
                            Código de Verificação (MFA)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              inputMode="numeric"
                              maxLength={6}
                              placeholder="000000"
                              {...field}
                              disabled={isSubmitting}
                              className="text-center text-2xl font-mono font-bold bg-slate-800 border-slate-700 text-emerald-400"
                            />
                          </FormControl>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        onClick={() => setStep('totp-scan')}
                        variant="outline"
                        className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                        size="lg"
                        disabled={isSubmitting}
                      >
                        Voltar ao QR Code
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting || !form.formState.isValid}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        size="lg"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verificando...
                          </>
                        ) : (
                          'Confirmar Código'
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            )}
          </>
        )}
      </div>
    </AuthLayout>
  );
}
