'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { forgotPassword as forgotPasswordService } from '@/services/auth.service';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import AuthLayout from '@/components/AuthLayout';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

const forgotPasswordSchema = z.object({
  email: z.string().email('Digite um email válido.'),
});

type FormValues = z.infer<typeof forgotPasswordSchema>;

/**
 * Página de Recuperação de Senha (Etapa 1)
 * 
 * Fluxo Real:
 * 1. Usuário insere o email cadastrado.
 * 2. Chamamos resetPasswordForEmail() do Supabase.
 * 3. O Supabase envia um email com link seguro de redirecionamento para o usuário.
 * 4. Por razões de privacidade (User Enumeration Prevention), sempre retornamos sucesso.
 * 5. O usuário clica no link do email, que o leva para o callback e o redireciona logado para /reset-password.
 */
export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      setServerError(null);

      const result = await forgotPasswordService(data.email);

      if (result.success) {
        setIsSuccess(true);
        setSubmittedEmail(data.email);
      } else {
        setServerError(result.message || 'Erro ao processar solicitação de recuperação.');
      }
    } catch (error) {
      console.error('[Forgot Password] Erro:', error);
      setServerError('Erro ao processar solicitação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Recuperar Senha"
      subtitle="Defina um link seguro de recuperação para seu email"
    >
      {!isSuccess ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Info */}
            <Card className="border-blue-500/20 bg-blue-500/5 p-3">
              <p className="text-xs text-blue-300 leading-relaxed">
                Insira seu email cadastrado e enviaremos um link de redefinição de senha seguro.
              </p>
            </Card>

            {serverError && (
              <Alert variant="destructive" className="border-red-500/50 bg-red-500/10">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      {...field}
                      disabled={isSubmitting}
                      className="bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500"
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            {/* Nota de Privacidade */}
            <Card className="border-amber-500/20 bg-amber-500/5 p-3">
              <p className="text-xs text-amber-300 leading-relaxed">
                <span className="font-semibold">🔒 Privacidade:</span> Em conformidade com a mitigação
                de User Enumeration, sempre exibiremos sucesso se o email for válido, independentemente
                dele estar cadastrado ou não.
              </p>
            </Card>

            {/* Botão */}
            <Button
              type="submit"
              disabled={isSubmitting || !form.formState.isValid}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                'Enviar Email de Recuperação'
              )}
            </Button>

            {/* Volta */}
            <div className="text-center text-sm text-slate-400">
              Lembrou a senha?{' '}
              <a
                href="/login"
                className="text-emerald-400 hover:text-emerald-300 transition-colors font-semibold"
              >
                Faça login
              </a>
            </div>
          </form>
        </Form>
      ) : (
        <div className="space-y-4 text-center">
          <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
          <h2 className="text-lg font-semibold text-slate-200">
            Email de recuperação enviado!
          </h2>
          <p className="text-sm text-slate-400">
            Se o email <span className="font-semibold text-slate-300">{submittedEmail}</span> estiver
            cadastrado no sistema, você receberá um link seguro de recuperação em instantes.
          </p>

          <Card className="border-slate-700 bg-slate-800/50 p-3">
            <p className="text-xs text-slate-300 leading-relaxed">
              Verifique sua caixa de entrada e spam. O link expira em breve.
            </p>
          </Card>

          <div className="pt-2">
            <Button
              onClick={() => setIsSuccess(false)}
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Voltar
            </Button>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
