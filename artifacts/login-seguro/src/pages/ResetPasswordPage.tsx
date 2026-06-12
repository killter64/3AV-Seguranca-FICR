import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { newPasswordSchema, NewPasswordFormData } from '@/lib/validators';
import { updatePassword as updatePasswordService } from '@/services/auth.service';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AuthLayout from '@/components/AuthLayout';
import PasswordStrengthMeter from '@/components/PasswordStrengthMeter';
import { AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function ResetPasswordPage() {
  const [, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<NewPasswordFormData>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const password = form.watch('password');

  const onSubmit = async (data: NewPasswordFormData) => {
    try {
      setIsSubmitting(true);
      setServerError(null);
      const result = await updatePasswordService(data.password);
      if (result.success) {
        setIsSuccess(true);
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setServerError(result.message || 'Erro ao redefinir sua senha.');
      }
    } catch (error) {
      setServerError('Erro ao processar alteração de senha.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <AuthLayout title="Senha Redefinida!" subtitle="Sua conta foi atualizada">
        <div className="space-y-6 text-center">
          <div className="flex justify-center">
            <div className="rounded-full bg-emerald-500/20 p-6">
              <CheckCircle2 className="h-12 w-12 text-emerald-400" />
            </div>
          </div>
          <p className="text-slate-300">Sua nova senha foi gravada com sucesso! Redirecionando para a tela de login...</p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Definir Nova Senha" subtitle="Proteja sua conta no Contábil+ com uma senha forte">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <Card className="border-blue-500/20 bg-blue-500/5 p-3">
            <p className="text-xs text-blue-300 leading-relaxed">
              Crie uma nova senha segura. Mínimo 12 caracteres, com maiúsculas, minúsculas,
              números e símbolos. Isso garante a segurança dos dados da sua empresa.
            </p>
          </Card>

          {serverError && (
            <Alert variant="destructive" className="border-red-500/50 bg-red-500/10">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-300">Nova Senha</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••••••" {...field} disabled={isSubmitting}
                    className="bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 font-mono" />
                </FormControl>
                <FormMessage className="text-red-400" />
                {password && <div className="pt-2"><PasswordStrengthMeter password={password} showCriteria={true} /></div>}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-300">Confirmar Nova Senha</FormLabel>
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
              <span className="font-semibold">📊 Criptografia:</span> Sua nova senha é protegida
              automaticamente com bcrypt e salt. Segurança de nível bancário para seus dados contábeis.
            </p>
          </Card>

          <Button type="submit" disabled={isSubmitting || !form.formState.isValid}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50" size="lg">
            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Gravando senha...</> : 'Redefinir Senha'}
          </Button>

          <div className="text-center text-sm text-slate-400">
            <a href="/login" className="text-emerald-400 hover:text-emerald-300 transition-colors font-semibold">
              Cancelar e voltar para login
            </a>
          </div>
        </form>
      </Form>
    </AuthLayout>
  );
}
