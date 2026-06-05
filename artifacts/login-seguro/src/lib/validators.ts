import { z } from 'zod';

export const emailSchema = z
  .string()
  .email('Email inválido')
  .trim()
  .toLowerCase();

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

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Senha obrigatória'),
});

export const otpSchema = z
  .string()
  .length(6, 'Código deve ter 6 dígitos')
  .regex(/^\d{6}$/, 'Código deve conter apenas números');

export const newPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Senhas não conferem',
    path: ['confirmPassword'],
  });

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

export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type OtpFormData = z.infer<typeof otpSchema>;
export type NewPasswordFormData = z.infer<typeof newPasswordSchema>;
