/**
 * SERVIÇO DE AUTENTICAÇÃO - SUPABASE (REAL)
 * 
 * Integração real com Supabase Auth.
 * Orquestra os fluxos de login, registro, MFA e recuperação de senha.
 * 
 * NOTA DE SEGURANÇA:
 * - Criptografia/Hashing: O hashing de senhas (bcrypt com salt) é feito de forma 100% segura
 *   no server-side (dentro do Supabase Auth) durante o registro e login. O frontend nunca
 *   tem acesso a chaves ou faz hashing local das credenciais.
 * - Gestão de Sessão: Gerenciada de forma totalmente segura pelo Supabase através de tokens JWT
 *   armazenados em cookies cifrados com flags de segurança (HttpOnly, Secure, SameSite=Strict).
 * - Rate Limiting: O Supabase implementa rate limiting nativo no servidor para evitar força bruta.
 */

import { RegisterFormData, LoginFormData } from '@/lib/validators';
import { createClient } from '@/utils/supabase/client';

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: string;
    email: string;
    mfaEnabled: boolean;
  };
  requiresMFA?: boolean;
  requiresMFASetup?: boolean;
}

/**
 * Registro de novo usuário com Supabase Auth
 */
export async function register(data: RegisterFormData): Promise<AuthResponse> {
  try {
    const supabase = createClient();

    // Supabase realiza o hashing (bcrypt + salt) automaticamente no servidor
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (authError) {
      console.error('[Auth] Erro no signup:', authError.message);
      return {
        success: false,
        message: authError.message || 'Erro ao registrar. Tente novamente.',
      };
    }

    if (!authData.user) {
      return {
        success: false,
        message: 'Erro ao criar usuário.',
      };
    }

    return {
      success: true,
      message: 'Registro bem-sucedido! Verifique seu email para obter o código de verificação.',
      user: {
        id: authData.user.id,
        email: authData.user.email || '',
        mfaEnabled: false,
      },
    };
  } catch (error) {
    console.error('[Auth] Erro no registro:', error);
    return {
      success: false,
      message: 'Erro ao registrar. Tente novamente.',
    };
  }
}

/**
 * Confirma o cadastro do usuário usando o código OTP recebido por email
 */
export async function verifyRegistrationOtp(
  email: string,
  token: string
): Promise<AuthResponse> {
  try {
    const supabase = createClient();
    console.log('[Auth] Verificando OTP de cadastro para:', email);

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup',
    });

    if (error) {
      console.error('[Auth] Erro na verificação OTP:', error);
      return {
        success: false,
        message: error.message || 'Código inválido ou expirado.',
      };
    }

    if (!data.user) {
      return {
        success: false,
        message: 'Erro ao verificar o código.',
      };
    }

    return {
      success: true,
      message: 'Email verificado com sucesso!',
      user: {
        id: data.user.id,
        email: data.user.email || '',
        mfaEnabled: false,
      },
    };
  } catch (error) {
    console.error('[Auth] Erro na verificação OTP:', error);
    return {
      success: false,
      message: 'Erro ao verificar o código. Tente novamente.',
    };
  }
}

/**
 * Reenvia o código de confirmação de cadastro por email
 */
export async function resendRegistrationOtp(email: string): Promise<AuthResponse> {
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });

    if (error) {
      console.error('[Auth] Erro ao reenviar OTP:', error);
      return { success: false, message: error.message };
    }

    return { success: true, message: 'Código reenviado com sucesso!' };
  } catch (error) {
    console.error('[Auth] Erro ao reenviar OTP:', error);
    return {
      success: false,
      message: 'Erro ao reenviar código. Tente novamente.',
    };
  }
}

/**
 * Login com email e senha via Supabase Auth
 */
export async function login(data: LoginFormData): Promise<AuthResponse> {
  console.log('[Auth] Iniciando login para:', data.email);
  try {
    const supabase = createClient();

    // Supabase valida a senha no servidor usando bcrypt com o salt armazenado
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (authError) {
      console.error('[Auth] Erro no signInWithPassword:', authError);
      return {
        success: false,
        message: authError.message || 'Email ou senha incorretos.',
      };
    }

    if (!authData.user || !authData.session) {
      return {
        success: false,
        message: 'Erro ao fazer login.',
      };
    }

    // Verificar se usuário possui fatores de MFA TOTP cadastrados
    const { data: factors, error: factorError } = await supabase.auth.mfa.listFactors();
    const hasMfaSetup = !factorError && factors?.totp && factors.totp.length > 0;

    // Verificar nível de autenticação (AAL) atual
    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    
    // Se possui MFA configurado e o nível atual é apenas senha (aal1), requer MFA
    const requiresMFA = hasMfaSetup && aalData?.currentLevel === 'aal1';
    
    // Se o projeto exige MFA obrigatoriamente e não há setup, requer setup
    const requiresMFASetup = !hasMfaSetup;

    return {
      success: true,
      message: 'Login efetuado.',
      token: authData.session.access_token,
      user: {
        id: authData.user.id,
        email: authData.user.email || '',
        mfaEnabled: hasMfaSetup,
      },
      requiresMFA,
      requiresMFASetup,
    };
  } catch (error) {
    console.error('[Auth] Erro no login:', error);
    return {
      success: false,
      message: 'Erro ao fazer login. Tente novamente.',
    };
  }
}

/**
 * Logout seguro via Supabase (invalida sessão no servidor e remove cookies)
 */
export async function logout(): Promise<AuthResponse> {
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('[Auth] Erro no logout:', error.message);
      return {
        success: false,
        message: 'Erro ao fazer logout.',
      };
    }

    return {
      success: true,
      message: 'Logout realizado com sucesso.',
    };
  } catch (error) {
    console.error('[Auth] Erro no logout:', error);
    return {
      success: false,
      message: 'Erro ao fazer logout.',
    };
  }
}

/**
 * Solicitar link de redefinição de senha via email
 */
export async function forgotPassword(email: string): Promise<AuthResponse> {
  try {
    const supabase = createClient();

    // Redireciona o usuário de volta para o callback que gerenciará a troca pelo token de sessão
    const redirectToUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback?next=/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectToUrl,
    });

    if (error) {
      console.warn('[Auth] Erro ao enviar reset:', error.message);
      return {
        success: false,
        message: error.message || 'Erro ao enviar email de recuperação.',
      };
    }

    return {
      success: true,
      message: 'Se o email existir, você receberá um link para redefinir sua senha.',
    };
  } catch (error) {
    console.error('[Auth] Erro no forgot-password:', error);
    return {
      success: false,
      message: 'Erro ao processar a solicitação de redefinição.',
    };
  }
}

/**
 * Atualizar a senha do usuário autenticado (chamado no reset-password)
 */
export async function updatePassword(newPassword: string): Promise<AuthResponse> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.error('[Auth] Erro ao atualizar senha:', error.message);
      return {
        success: false,
        message: error.message || 'Erro ao atualizar senha.',
      };
    }

    return {
      success: true,
      message: 'Senha atualizada com sucesso!',
      user: {
        id: data.user?.id || '',
        email: data.user?.email || '',
        mfaEnabled: false,
      },
    };
  } catch (error) {
    console.error('[Auth] Erro ao atualizar senha:', error);
    return {
      success: false,
      message: 'Erro ao atualizar senha.',
    };
  }
}

/**
 * Obter usuário logado atual e verificar sessão
 */
export async function getCurrentUser() {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      emailVerified: user.email_confirmed_at !== null,
    };
  } catch (error) {
    console.error('[Auth] Erro ao obter usuário:', error);
    return null;
  }
}
