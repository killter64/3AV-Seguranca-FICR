'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { otpSchema } from '@/lib/validators';
import {
  listMFAFactors,
  createMFAChallenge,
  verifyMFACode,
} from '@/services/totp.service';
import { useAuthStore } from '@/store/auth.store';
import { useSupabaseSession } from '@/hooks/use-supabase-session';
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
  ArrowLeft,
} from 'lucide-react';

const formSchema = z.object({
  code: otpSchema,
});

type FormValues = z.infer<typeof formSchema>;

export default function MfaVerifyPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const setMfaPending = useAuthStore((state) => state.setMfaPending);
  const { isLoading: sessionLoading } = useSupabaseSession();

  const [factorId, setFactorId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);

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
    // Carregar fatores MFA cadastrados
    fetchFactors();
  }, [sessionLoading, user, router]);

  const fetchFactors = async () => {
    try {
      setIsLoading(true);
      setServerError(null);

      const factors = await listMFAFactors();
      if (factors && factors.totp && factors.totp.length > 0) {
        // Obter o primeiro fator TOTP ativo
        setFactorId(factors.totp[0].id);
      } else {
        // Usuário não tem MFA cadastrado. Como é obrigatório, mandar para o Setup.
        router.push('/mfa/setup');
      }
    } catch (err) {
      console.error('[MFA Verify] Erro ao listar fatores:', err);
      setServerError('Erro ao recuperar configurações de segurança.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (data: FormValues) => {
    if (!factorId) {
      setServerError('Fator de segurança não encontrado.');
      return;
    }

    try {
      setIsSubmitting(true);
      setServerError(null);

      // 1. Criar desafio MFA
      const challengeResult = await createMFAChallenge(factorId);

      if (!challengeResult.success || !challengeResult.challengeId) {
        setServerError(challengeResult.message || 'Erro ao criar desafio para o código.');
        return;
      }

      // 2. Verificar código contra o desafio
      const verifyResult = await verifyMFACode(
        data.code,
        challengeResult.challengeId,
        factorId
      );

      if (verifyResult.success) {
        setIsVerified(true);
        setMfaPending(false);
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      } else {
        setServerError(verifyResult.message || 'Código do autenticador inválido ou expirado.');
      }
    } catch (err) {
      console.error('[MFA Verify] Erro na validação:', err);
      setServerError('Erro ao validar o código de autenticação.');
    } finally {
      setIsSubmitting(false);
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

  return (
    <AuthLayout
      title="Autenticação Multifator"
      subtitle="Confirme o código temporário no seu celular"
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

        {isVerified && (
          <Alert className="border-emerald-500/50 bg-emerald-500/10 text-emerald-300">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <AlertDescription>
              Código verificado! Acesso concedido...
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
          </div>
        ) : (
          <>
            <div className="flex justify-center py-2">
              <Smartphone className="h-12 w-12 text-emerald-400 animate-pulse" />
            </div>

            <Card className="border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
              <p className="text-xs text-slate-300">
                Abra seu aplicativo autenticador (ex: Google Authenticator) e insira o código de 6 dígitos temporário gerado para este sistema.
              </p>
            </Card>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleVerify)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300 text-center block">Código de Autenticação (MFA)</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          placeholder="000000"
                          {...field}
                          disabled={isSubmitting || isVerified}
                          className="text-center text-2xl font-mono font-bold bg-slate-800 border-slate-700 text-emerald-400"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isSubmitting || isVerified || !form.formState.isValid}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
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
              </form>
            </Form>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
