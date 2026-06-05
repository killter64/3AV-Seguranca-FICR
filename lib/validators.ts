import { z } from 'zod';

/**
 * Validador de Email
 * RFC 5322 simplificado para UX adequada
 */
export const emailSchema = z
  .string()
  .email('Email inválido')
  .trim()
  .toLowerCase();

/**
 * Política de Senha Rigorosa (FATOR 1: O que o usuário sabe)
 * Requisitos:
 * - Mínimo 12 caracteres
 * - Pelo menos 1 letra maiúscula
 * - Pelo menos 1 letra minúscula
 * - Pelo menos 1 número
 * - Pelo menos 1 símbolo especial (!@#$%^&*)
 * 
 * Esta política implementa OWASP guidance para senhas fortes
 */
export const passwordSchema = z
  .string()
  .min(12, 'Mínimo 12 caracteres')
  .refine(
    (pwd) => /[A-Z]/.test(pwd),
    'Deve conter pelo menos 1 letra MAIÚSCULA'
  )
  .refine(
    (pwd) => /[a-z]/.test(pwd),
    'Deve conter pelo menos 1 letra minúscula'
  )
  .refine(
    (pwd) => /[0-9]/.test(pwd),
    'Deve conter pelo menos 1 número'
  )
  .refine(
    (pwd) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
    'Deve conter pelo menos 1 símbolo especial (!@#$%^&*...)'
  );

/**
 * Validador de Registro
 */
export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Senhas não conferem',
    path: ['confirmPassword'],
  });

/**
 * Validador de Login
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Senha obrigatória'),
});

/**
 * Validador de Código OTP (6 dígitos)
 */
export const otpSchema = z
  .string()
  .length(6, 'Código deve ter 6 dígitos')
  .regex(/^\d{6}$/, 'Código deve conter apenas números');

/**
 * Validador de Nova Senha (para reset)
 */
export const newPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Senhas não conferem',
    path: ['confirmPassword'],
  });

/**
 * Analisador de Força de Senha
 * Retorna: weak, medium, strong
 */
export function analyzePasswordStrength(password: string): {
  score: number;
  level: 'weak' | 'medium' | 'strong';
  criteria: {
    minLength: boolean;
    uppercase: boolean;
    lowercase: boolean;
    numbers: boolean;
    symbols: boolean;
  };
} {
  const criteria = {
    minLength: password.length >= 12,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    numbers: /[0-9]/.test(password),
    symbols: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  const score = Object.values(criteria).filter(Boolean).length;

  let level: 'weak' | 'medium' | 'strong' = 'weak';
  if (score >= 4) level = 'strong';
  else if (score >= 3) level = 'medium';

  return { score, level, criteria };
}

/**
 * Tipos exportados para TS
 */
export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type OtpFormData = z.infer<typeof otpSchema>;
export type NewPasswordFormData = z.infer<typeof newPasswordSchema>;
