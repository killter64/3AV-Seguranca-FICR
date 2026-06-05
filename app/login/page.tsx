'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormData } from '@/lib/validators';
import { login as loginService } from '@/services/auth.service';
import {
  isRateLimited,
  recordFailedAttempt,
  clearAttempts,
} from '@/services/rate-limit';
import { useAuthStore } from '@/store/auth.store';
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
import SecurityHeadersNote from '@/components/SecurityHeadersNote';
import { AlertCircle, Loader2, Lock, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';

/**
 * Página de Login com Supabase Auth (Real)
 * 
 * Fluxo Real:
 * 1. Usuário insere email e senha.
 * 2. Validação local pelo schema do Zod.
 * 3. Envio ao Supabase, que realiza a verificação de hash bcrypt no servidor.
 * 4. Após o login, é verificado o nível AAL:
 *    - Se possuir MFA cadastrado -> Redirecionar para /mfa/verify
 *    - Se NÃO possuir MFA cadastrado -> Redirecionar para /mfa/setup (Obrigatório)
 *    - Se autenticado completamente -> Redirecionar para /dashboard
 * 
 * Defesas Implementadas:
 * ✅ Hashing seguro server-side (Supabase bcrypt)
 * ✅ Session cookies com flags HttpOnly/Secure/SameSite
 * ✅ Rate limiting do Supabase + Cooldown local (3 tentativas erradas = 30s de bloqueio)
 * ✅ XSS input escaping automático
 */
export default function LoginPage() {
  const router = useRouter();
  const setMfaPending = useAuthStore((state) => state.setMfaPending);
  const setUser = useAuthStore((state) => state.setUser);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const [remainingCooldown, setRemainingCooldown] = useState(0);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Cooldown de rate limiting local
  useEffect(() => {
    if (remainingCooldown > 0) {
      const timer = setTimeout(() => setRemainingCooldown(remainingCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [remainingCooldown]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      const email = data.email.toLowerCase();

      // Verificar rate limiting local
      const { blocked, remainingTime } = isRateLimited(email);
      if (blocked) {
        setRateLimitError(
          `Muitas tentativas malsucedidas. Aguarde ${remainingTime}s para tentar novamente.`
        );
        setRemainingCooldown(remainingTime);
        return;
      }

      setIsSubmitting(true);
      setRateLimitError(null);
      setServerError(null);

      // Chamar serviço de login real
      const result = await loginService(data);

      if (result.success && result.user) {
        // Limpar tentativas após sucesso
        clearAttempts(email);

        // Armazenar informações básicas do usuário no store
        setUser(result.user);

        if (result.requiresMFASetup) {
          setMfaPending(true);
          router.push('/mfa/setup');
        } else if (result.requiresMFA) {
          setMfaPending(true);
          router.push('/mfa/verify');
        } else {
          setMfaPending(false);
          router.push('/dashboard');
        }
      } else {
        // Registrar tentativa falha local
        const attempt = recordFailedAttempt(email);

        if (attempt.blocked) {
          setRateLimitError(
            `Conta bloqueada localmente por ${attempt.remainingTime}s para prevenção de brute-force.`
          );
          setRemainingCooldown(attempt.remainingTime);
        } else {
          setServerError(result.message || 'Email ou senha inválidos.');
        }
      }
    } catch (error) {
      console.error('[Login] Erro:', error);
      setServerError('Erro ao fazer login. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isRateLimitActive = remainingCooldown > 0;
  const isButtonDisabled =
    isSubmitting ||
    isRateLimitActive ||
    !form.formState.isValid;

  return (
    <AuthLayout
      title="Fazer Login"
      subtitle="Acesso seguro com autenticação multifator"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* Alertas */}
          {rateLimitError && (
            <Alert variant="destructive" className="border-red-500/50 bg-red-500/10">
              <Clock className="h-4 w-4" />
              <AlertDescription>{rateLimitError}</AlertDescription>
            </Alert>
          )}

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
                    disabled={isSubmitting || isRateLimitActive}
                    className="bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500"
                  />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

          {/* Senha */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-slate-300">Senha</FormLabel>
                  <a
                    href="/forgot-password"
                    className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    Esqueceu a senha?
                  </a>
                </div>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••••••"
                    {...field}
                    disabled={isSubmitting || isRateLimitActive}
                    className="bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500"
                  />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

          {/* Aviso de Brute Force */}
          {isRateLimitActive && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3">
              <p className="text-xs text-red-300 flex items-center gap-2">
                <Lock className="h-3 w-3" />
                Botão desabilitado temporariamente por proteção contra força bruta
              </p>
            </div>
          )}

          {/* Botão de Login */}
          <Button
            type="submit"
            disabled={isButtonDisabled}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Autenticando...
              </>
            ) : isRateLimitActive ? (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Aguarde {remainingCooldown}s
              </>
            ) : (
              'Fazer Login'
            )}
          </Button>

          {/* Link para Registro */}
          <div className="text-center text-sm text-slate-400">
            Não tem uma conta?{' '}
            <a
              href="/register"
              className="text-emerald-400 hover:text-emerald-300 transition-colors font-semibold"
            >
              Registre-se
            </a>
          </div>
        </form>
      </Form>

      {/* Informações de Segurança */}
      <div className="space-y-3 border-t border-slate-700 pt-5 mt-5">
        <SecurityHeadersNote />

        <Card className="border-amber-500/20 bg-amber-500/5 p-3">
          <p className="text-xs text-amber-300 leading-relaxed">
            <span className="font-semibold">🛡️ Sessão e Hashing:</span> As senhas são hashadas
            server-side com bcrypt pelo Supabase de forma nativa. Os tokens de sessão são mantidos
            em cookies HttpOnly, Secure e SameSite=Strict gerenciados automaticamente.
          </p>
        </Card>
      </div>
    </AuthLayout>
  );
}
