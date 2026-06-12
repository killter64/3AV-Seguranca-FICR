import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterFormData } from '@/lib/validators';
import { register as registerUser } from '@/services/auth.service';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AuthLayout from '@/components/AuthLayout';
import PasswordStrengthMeter from '@/components/PasswordStrengthMeter';
import { AlertCircle, Loader2, UserPlus } from 'lucide-react';

export default function RegisterPage() {
  const [, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  const password = form.watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsSubmitting(true);
      setServerError(null);
      const result = await registerUser(data);
      if (result.success && result.user) {
        navigate(`/verify-email?email=${encodeURIComponent(result.user.email)}`);
      } else {
        setServerError(result.message || 'Erro ao registrar');
      }
    } catch (error) {
      setServerError('Erro ao processar registro. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid =
    form.formState.isDirty &&
    form.getValues('email') &&
    form.getValues('password') &&
    form.getValues('confirmPassword') &&
    form.getValues('password') === form.getValues('confirmPassword') &&
    !isSubmitting;

  return (
    <AuthLayout title="Criar Conta" subtitle="Comece a gerenciar as finanças do seu negócio">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {serverError && (
            <Alert variant="destructive" className="border-red-500/50 bg-red-500/10">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-300">Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="seu@email.com" {...field} disabled={isSubmitting}
                    className="bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500" />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-300">Senha</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••••••" {...field} disabled={isSubmitting}
                    className="bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 font-mono" />
                </FormControl>
                <FormMessage className="text-red-400" />
                {password && (
                  <div className="pt-2">
                    <PasswordStrengthMeter password={password} showCriteria={true} />
                  </div>
                )}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-300">Confirmar Senha</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••••••" {...field} disabled={isSubmitting}
                    className="bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 font-mono" />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

          <Card className="border-emerald-500/20 bg-emerald-500/5 p-3">
            <p className="text-xs text-emerald-300 leading-relaxed">
              <span className="font-semibold">📊 Contábil+:</span> Sua senha será protegida com criptografia de nível bancário.
              Após o cadastro, você poderá cadastrar sua empresa, controlar receitas e despesas,
              e acompanhar seu fluxo de caixa em tempo real.
            </p>
          </Card>

          <Button type="submit" disabled={!isFormValid}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed" size="lg">
            {isSubmitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processando...</>
            ) : 'Criar Conta'}
          </Button>

          <div className="text-center text-sm text-slate-400">
            Já tem uma conta?{' '}
            <a href="/login" className="text-emerald-400 hover:text-emerald-300 transition-colors font-semibold">
              Faça login
            </a>
          </div>
        </form>
      </Form>
    </AuthLayout>
  );
}
