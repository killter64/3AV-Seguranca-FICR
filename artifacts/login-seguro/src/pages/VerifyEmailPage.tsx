import React, { useState, useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { otpSchema } from '@/lib/validators';
import { verifyRegistrationOtp, resendRegistrationOtp } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AuthLayout from '@/components/AuthLayout';
import { Mail, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

const formSchema = z.object({ code: otpSchema });
type FormValues = z.infer<typeof formSchema>;

export default function VerifyEmailPage() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const email = params.get('email') || '';
  const setUser = useAuthStore((state) => state.setUser);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [resendAttempts, setResendAttempts] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const [isVerified, setIsVerified] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { code: '' },
  });

  useEffect(() => {
    if (!email) navigate('/register');
  }, [email]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      setServerError(null);
      const result = await verifyRegistrationOtp(email, data.code);
      if (result.success && result.user) {
        setUser(result.user);
        setIsVerified(true);
        setTimeout(() => navigate('/mfa/setup'), 1500);
      } else {
        setServerError(result.message || 'Código inválido ou expirado.');
      }
    } catch (error) {
      setServerError('Erro ao verificar o código');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendAttempts >= 3) {
      alert('Limite de reenvios atingido. Tente novamente mais tarde.');
      return;
    }
    setResendAttempts(resendAttempts + 1);
    setCooldown(60);
    const result = await resendRegistrationOtp(email);
    if (!result.success) setServerError(result.message);
  };

  if (!email) return null;

  if (isVerified) {
    return (
      <AuthLayout title="Email Verificado!" subtitle="Preparando seu ambiente Contábil+...">
        <div className="space-y-6 text-center">
          <div className="flex justify-center">
            <div className="rounded-full bg-emerald-500/20 p-6">
              <CheckCircle2 className="h-12 w-12 text-emerald-400" />
            </div>
          </div>
          <p className="text-slate-300">Email confirmado! Agora vamos configurar sua autenticação de dois fatores para proteger seus dados financeiros.</p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Verifique Seu Email" subtitle="Confirme seu email para ativar sua conta no Contábil+">
      <div className="space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-emerald-500/20 p-6">
            <Mail className="h-12 w-12 text-emerald-400" />
          </div>
        </div>

        <Card className="border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
          <p className="text-sm text-slate-300">Enviamos um código OTP para:</p>
          <p className="mt-1 font-mono text-emerald-400 font-semibold break-all">{email}</p>
        </Card>

        {serverError && (
          <Alert variant="destructive" className="border-red-500/50 bg-red-500/10">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300 text-center block">Código de 6 dígitos</FormLabel>
                  <FormControl>
                    <Input type="text" inputMode="numeric" maxLength={6} placeholder="000000"
                      {...field} disabled={isSubmitting}
                      className="text-center text-2xl font-mono font-bold bg-slate-800 border-slate-700 text-emerald-400" />
                  </FormControl>
                  <FormMessage className="text-red-400 text-center" />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting || !form.formState.isValid}
              className="w-full bg-emerald-600 hover:bg-emerald-700" size="lg">
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verificando...</> : 'Verificar Código'}
            </Button>
          </form>
        </Form>

        <Button onClick={handleResend} disabled={cooldown > 0 || isSubmitting}
          variant="outline" className="w-full border-slate-700 text-slate-300 hover:bg-slate-800" size="lg">
          {cooldown > 0 ? `Reenviar código em ${cooldown}s` : 'Reenviar Código por Email'}
        </Button>
      </div>
    </AuthLayout>
  );
}
